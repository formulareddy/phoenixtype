import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { configStore, setConfig } from "../lib/config-store";
import { useResults } from "../lib/results-store";
import type { TestStats } from "../types";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import ReplayView from "./ReplayView";

Chart.defaults.elements.line.tension = 0.5;
Chart.defaults.elements.line.fill = "origin";
(Chart.defaults.animation as any).duration = 0;

Chart.register(annotationPlugin);

interface Props {
  stats: TestStats;
  onRestart: () => void;
  onRepeat: () => void;
  onPractice: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return `${seconds.toFixed(1)}s`;
}

function smoothWithValueWindow(
  arr: number[],
  windowSize: number,
  valueWindowSize: number,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const currentValue = arr[i] as number;
    const from = Math.max(0, i - windowSize);
    const to = Math.min(arr.length, i + windowSize + 1);
    let count = 0;
    let sum = 0;
    for (let j = from; j < to; j++) {
      const neighborValue = arr[j] as number;
      if (Math.abs(neighborValue - currentValue) <= valueWindowSize) {
        sum += neighborValue;
        count++;
      }
    }
    result[i] = count > 0 ? sum / count : currentValue;
  }
  return result;
}

export default function Results(props: Props) {
  const s = props.stats;
  const { results } = useResults();

  const [showWordHistory, setShowWordHistory] = createSignal(false);
  const [showReplay, setShowReplay] = createSignal(false);
  const [showRaw, setShowRaw] = createSignal(true);
  const [showBurst, setShowBurst] = createSignal(true);
  const [showErrors, setShowErrors] = createSignal(true);
  const [showPbLine, setShowPbLine] = createSignal(true);

  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | null = null;

  const bestPb = () => {
    const sameMode = results().filter(r => r.mode === s.mode);
    return sameMode.length > 0 ? Math.max(...sameMode.map(r => r.wpm)) : 0;
  };

  const isNewPb = () => {
    const pb = bestPb();
    return pb > 0 && Math.round(s.wpm) >= pb;
  };

  const crownState = (): string => {
    if (isNewPb()) return "pending";
    if (s.accuracy < 50 || s.consistency < 30) return "ineligible";
    return "normal";
  };

  const avgWpm = () => {
    const last10 = results().slice(0, 10);
    return last10.length > 0 ? Math.round(last10.reduce((sum, x) => sum + x.wpm, 0) / last10.length) : 0;
  };

  const avgAcc = () => {
    const last10 = results().slice(0, 10);
    return last10.length > 0 ? (last10.reduce((sum, x) => sum + x.acc, 0) / last10.length).toFixed(1) : "0.0";
  };

  const hasChartData = () => s.chartData && s.chartData.length > 0;

  onMount(() => {
    if (!canvasRef || !hasChartData()) return;
    let data = s.chartData;
    const elapsed = s.elapsed || data.length;
    const isTimeMode = s.mode?.includes("time");
    const isPartialSecond = elapsed % 1 > 0.001;

    // Build labels with monkeytype-style last-partial-second handling
    let labels = data.map((_, i) => `${i + 1}`);
    if (isPartialSecond) {
      labels[labels.length - 1] = (Math.round(elapsed * 100) / 100).toString();
      if (!isTimeMode && (elapsed % 1) < 0.5) {
        data = data.slice(0, -1);
        labels = labels.slice(0, -1);
      }
    }

    // Apply monkeytype's burst smoothing
    const maxBurst = data.length > 0 ? Math.max(...data.map(d => d.burst)) : 0;
    const valueWindow = maxBurst * 0.25;
    const smoothedBurst = smoothWithValueWindow(
      data.map(d => d.burst), 1, valueWindow > 0 ? valueWindow : 0
    );

    const root = document.documentElement;
    const style = getComputedStyle(root);
    const mainColor = style.getPropertyValue("--main").trim() || "#e2b714";
    const subColor = style.getPropertyValue("--sub").trim() || "#646669";
    const subAltColor = style.getPropertyValue("--sub-alt").trim() || "#2c2e31";
    const errorColor = style.getPropertyValue("--error").trim() || "#ca4754";
    const bgColor = style.getPropertyValue("--bg").trim() || "#323437";

    const fullUnitStrings: Record<string, string> = {
      wpm: "Words per Minute",
      cpm: "Characters per Minute",
      wps: "Words per Second",
      cps: "Characters per Second",
      wph: "Words per Hour",
    };
    const axisTitle = fullUnitStrings[configStore.typingSpeedUnit] || configStore.typingSpeedUnit.toUpperCase();

    function fromWpm(wpm: number): number {
      switch (configStore.typingSpeedUnit) {
        case "cpm": return wpm * 5;
        case "wps": return wpm / 60;
        case "cps": return wpm * 5 / 60;
        case "wph": return wpm * 60;
        default: return wpm;
      }
    }

    const pb = bestPb();
    const pbConverted = Math.round(fromWpm(pb) * 100) / 100;
    const showPbInitially = showPbLine();

    const shouldStartAtZero = configStore.startGraphsAtZero;
    let chartMin = 0;
    let chartMax: number | undefined;
    let stepSize = 10;
    if (data.length > 0) {
      const allValues = data.flatMap(d => [fromWpm(d.wpm), fromWpm(d.raw), fromWpm(d.burst)]);
      if (!shouldStartAtZero) {
        chartMin = Math.floor(Math.min(...allValues) / 10) * 10;
      }
      const rawMax = Math.max(...allValues);
      chartMax = Math.ceil(rawMax / 10) * 10;
      // Match monkeytype's nice step: aim for ~5-7 ticks
      const range = chartMax - chartMin;
      const rawStep = range / 6;
      const exp = Math.floor(Math.log10(rawStep));
      const frac = rawStep / Math.pow(10, exp);
      if (frac <= 1.5) stepSize = Math.pow(10, exp);
      else if (frac <= 3.5) stepSize = 2 * Math.pow(10, exp);
      else if (frac <= 7.5) stepSize = 5 * Math.pow(10, exp);
      else stepSize = 10 * Math.pow(10, exp);
      chartMax = Math.ceil(chartMax / stepSize) * stepSize;
    }

    chartInstance = new Chart(canvasRef, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            clip: false,
            label: "wpm",
            data: data.map(d => Math.round(fromWpm(d.wpm) * 100) / 100),
            borderColor: mainColor,
            backgroundColor: "transparent",
            borderWidth: 3,
            tension: 0.5,
            pointRadius: 1,
            pointHoverRadius: 4,
            yAxisID: "wpm",
            order: 2,
          },
          {
            clip: false,
            label: "raw",
            data: data.map(d => Math.round(fromWpm(d.raw) * 100) / 100),
            borderColor: mainColor + "99",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [8, 8],
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            yAxisID: "raw",
            order: 3,
          },
          {
            clip: false,
            label: "burst",
            data: smoothedBurst.map(v => Math.round(fromWpm(v) * 100) / 100),
            borderColor: subColor,
            backgroundColor: subAltColor + "80",
            borderWidth: 3,
            fill: "origin",
            tension: 0.5,
            pointRadius: 1,
            pointHoverRadius: 4,
            yAxisID: "burst",
            order: 4,
          },
          {
            clip: false,
            label: "errors",
            data: data.map(d => d.err),
            borderColor: errorColor,
            backgroundColor: errorColor,
            borderWidth: 2,
            type: "scatter",
            pointStyle: "crossRot",
            pointRadius: function(ctx: any) {
              const val = ctx.dataset.data[ctx.dataIndex] as number;
              return val > 0 ? 3 : 0;
            },
            pointHoverRadius: function(ctx: any) {
              const val = ctx.dataset.data[ctx.dataIndex] as number;
              return val > 0 ? 5 : 0;
            },
            yAxisID: "error",
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 } as any,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          annotation: pb > 0 ? {
            annotations: {
              pbLine: {
                type: "line",
                yMin: pbConverted,
                yMax: pbConverted,
                borderColor: subColor + "55",
                borderWidth: 1,
                display: showPbInitially,
                label: {
                  display: true,
                  content: `PB: ${pbConverted}`,
                  position: "center",
                  backgroundColor: subColor,
                  color: bgColor,
                  font: { size: 11, family: "Roboto Mono, monospace" },
                  padding: { x: 6, y: 2 },
                },
              },
            },
          } : {},
        },
        scales: {
          x: {
            display: true,
            grid: { color: subAltColor, tickColor: subAltColor },
            border: { color: subAltColor },
            ticks: {
              color: subColor,
              font: { size: 10 },
              autoSkip: true,
              autoSkipPadding: 20,
            },
            title: { display: false },
          },
          wpm: {
            axis: "y",
            display: true,
            beginAtZero: shouldStartAtZero,
            min: chartMin,
            max: chartMax,
            grid: { color: subAltColor, tickColor: subAltColor },
            border: { color: subAltColor },
            ticks: {
              color: subColor,
              font: { size: 10 },
              autoSkip: true,
              autoSkipPadding: 20,
              precision: 0,
              stepSize,
            },
            title: {
              display: true,
              text: axisTitle,
              color: subColor,
              font: { size: 11 },
            },
          },
          raw: {
            axis: "y",
            display: false,
            beginAtZero: shouldStartAtZero,
            min: chartMin,
            max: chartMax,
            grid: { display: false },
            ticks: { color: subColor, font: { size: 10 }, precision: 0 },
            title: { display: false },
          },
          burst: {
            axis: "y",
            display: false,
            beginAtZero: shouldStartAtZero,
            min: chartMin,
            max: chartMax,
            grid: { display: false },
            ticks: { color: subColor, font: { size: 10 }, precision: 0 },
            title: { display: false },
          },
          error: {
            axis: "y",
            display: true,
            position: "right",
            beginAtZero: true,
            max: data.length > 0 ? Math.max(...data.map(d => d.err)) : undefined,
            grid: { display: false },
            ticks: {
              color: subColor,
              font: { size: 10 },
              precision: 0,
              autoSkip: true,
              autoSkipPadding: 20,
            },
            title: {
              display: true,
              text: "Errors",
              color: subColor,
              font: { size: 11 },
            },
          },
        },
      },
    });
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  });

  function toggleDataset(key: string) {
    if (!chartInstance) return;
    const meta = chartInstance.data.datasets.find(d => d.label === key);
    if (meta) meta.hidden = !meta.hidden;
    chartInstance.update();
  }

  function handleToggleRaw() {
    setShowRaw(p => !p);
    toggleDataset("raw");
  }
  function handleToggleBurst() {
    setShowBurst(p => !p);
    toggleDataset("burst");
  }
  function handleToggleErrors() {
    setShowErrors(p => !p);
    toggleDataset("errors");
  }
  function handleTogglePbLine() {
    setShowPbLine(p => !p);
    if (chartInstance) {
      const annot = (chartInstance.options.plugins?.annotation as any)?.annotations?.pbLine;
      if (annot) {
        annot.display = !annot.display;
        chartInstance.update("none");
      }
    }
  }

  function handleScreenshot() {
    const el = document.querySelector(".result-page") as HTMLElement;
    if (!el) return;
    const watermark = el.querySelector(".ssWatermark") as HTMLElement;
    if (watermark) {
      watermark.classList.remove("hidden");
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const dateStr = `${day} ${month} ${year} ${hours}:${minutes}`;
      watermark.innerHTML = `<span>${dateStr}</span><span class='pipe'>|</span><span>phoenixtype.com</span>`;
    }
    import("modern-screenshot").then(({ domToPng }) => {
      domToPng(el, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#323437",
        scale: 2,
      }).then((dataUrl: string) => {
        if (watermark) {
          watermark.classList.add("hidden");
          watermark.innerHTML = "phoenixtype.com";
        }
        const a = document.createElement("a");
        a.download = `phoenixtype-${s.mode.replace(/\s+/g, "-")}-${Math.round(s.wpm)}wpm.png`;
        a.href = dataUrl;
        a.click();
      });
    }).catch(() => {
      if (watermark) {
        watermark.classList.add("hidden");
        watermark.innerHTML = "phoenixtype.com";
      }
    });
  }

  const crown = crownState();
  const hasPb = bestPb() > 0;

  return (
    <div class="result-page content-grid full-width" tabIndex={-1}>
      <div class="wrapper">
        <div class="stats">
          <div class="group wpm">
            <div class="top">
              <div class="text">{configStore.typingSpeedUnit.toUpperCase()}</div>
              <div class={`crown${crown !== "normal" ? " " + crown : ""}${!hasPb ? " hidden" : ""}`} aria-label="" data-balloon-pos="up" data-balloon-length="medium">
                <i class="fas fa-question"></i>
                <i class="fas fa-crown"></i>
                <i class="fas fa-slash"></i>
                <i class="fas fa-exclamation-triangle"></i>
              </div>
            </div>
            <div class="bottom" aria-label="" data-balloon-pos="up">{Math.round(s.wpm)}</div>
          </div>
          <div class="group acc">
            <div class="top">acc</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">{s.accuracy >= 100 ? "100" : s.accuracy.toFixed(1)}%</div>
          </div>
        </div>

        <div class="chart">
          <div class="chartLegend">
            <button
              classList={{ text: true, active: !configStore.startGraphsAtZero }}
              tabIndex={-1}
              data-id="scale"
              onClick={() => {
                const newVal = !configStore.startGraphsAtZero;
                setConfig("startGraphsAtZero", newVal);
                if (chartInstance) {
                  const wpmScale = chartInstance.options.scales!.wpm as any;
                  const rawScale = chartInstance.options.scales!.raw as any;
                  const burstScale = chartInstance.options.scales!.burst as any;
                  const allData = chartInstance.data.datasets.flatMap(d => d.data as number[]).filter(v => v > 0);
                  const newMin = newVal ? 0 : Math.floor(Math.min(...allData) / 10) * 10;
                  const newMax = Math.ceil(Math.max(...allData) / 10) * 10;
                  const rawStep = (newMax - newMin) / 6;
                  const exp = Math.floor(Math.log10(rawStep));
                  const frac = rawStep / Math.pow(10, exp);
                  let stepSize = 10;
                  if (frac <= 1.5) stepSize = Math.pow(10, exp);
                  else if (frac <= 3.5) stepSize = 2 * Math.pow(10, exp);
                  else if (frac <= 7.5) stepSize = 5 * Math.pow(10, exp);
                  else stepSize = 10 * Math.pow(10, exp);
                  [wpmScale, rawScale, burstScale].forEach(s => { s.beginAtZero = newVal; s.min = newMin; s.max = Math.ceil(newMax / stepSize) * stepSize; });
                  wpmScale.ticks.stepSize = stepSize;
                  chartInstance.update();
                }
              }}
            >
              <i class="fas fa-chart-line"></i>
              <div class="text">scale</div>
            </button>
            <button
              classList={{ text: true, active: showPbLine() }}
              tabIndex={-1}
              data-id="pbLine"
              onClick={handleTogglePbLine}
            >
              <i class="fas fa-crown"></i>
              <div class="text">pb</div>
            </button>
            <button
              classList={{ text: true, active: false }}
              tabIndex={-1}
              data-id="tagPbLine"
              onClick={() => {}}
            >
              <i class="fas fa-tag"></i>
              <div class="text">tag pb</div>
            </button>
            <button
              classList={{ text: true, active: showRaw() }}
              tabIndex={-1}
              data-id="raw"
              onClick={handleToggleRaw}
            >
              <span class="line dashed"></span>
              <div class="text">raw</div>
            </button>
            <button
              classList={{ text: true, active: showBurst() }}
              tabIndex={-1}
              data-id="burst"
              onClick={handleToggleBurst}
            >
              <span class="line"></span>
              <div class="text">burst</div>
            </button>
            <button
              classList={{ text: true, active: showErrors() }}
              tabIndex={-1}
              data-id="errors"
              onClick={handleToggleErrors}
            >
              <i class="fas fa-times"></i>
              <div class="text">errors</div>
            </button>
          </div>
          <canvas ref={canvasRef} id="wpmChart"></canvas>
        </div>

        <div class="stats morestats">
          <div class="group testType">
            <div class="top">test type</div>
            <div class="bottom">{s.mode} {s.language}</div>
            <div class="tags hidden">
              <div class="top"><span>tags</span></div>
              <div class="bottom">-</div>
            </div>
          </div>
          <div class="group info">
            <div class="top">other</div>
            <div class="bottom">
              {s.consistency < 50 ? "inconsistent" : ""}
              {s.totalKeystrokes < 10 ? " too short" : ""}
            </div>
          </div>
          <div class="group raw">
            <div class="top">raw</div>
            <div class="bottom">{Math.round(s.raw)}</div>
          </div>
          <div class="group key">
            <div class="top">characters</div>
            <div class="bottom" aria-label="correct&#10;incorrect&#10;extra&#10;missed" data-balloon-break data-balloon-pos="up">{s.correctChars}/{s.incorrectChars}/{s.extraChars}/{s.missedChars}</div>
          </div>
          <div class="group flat consistency">
            <div class="top">consistency</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">{Math.round(s.consistency)}%</div>
          </div>
          <div class="group time">
            <div class="top">time</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              <div class="text">{formatDuration(s.elapsed)}</div>
              <div class="afk"></div>
              <div class="timeToday"></div>
            </div>
          </div>
          <div class="group dailyLeaderboard hidden">
            <div class="top">daily leaderboard</div>
            <div class="bottom">-</div>
          </div>
          <div class="group source hidden">
            <div class="top">source</div>
            <div class="bottom">-</div>
          </div>
        </div>

        <div class="bottom">
          <div id="resultWordsHistory" class={showWordHistory() ? "" : "hidden"}>
            <div class="title">
              <span>input history</span>
            </div>
            <div class="words">
              {s.wordHistory.map(w => {
                const catColor = w.category === "fast" ? "var(--main)" : w.category === "slow" ? "#e6a020" : w.category === "missed" ? "var(--error)" : undefined;
                return (
                <span class="word" classList={{ heatmapInherit: true, [w.category || "ok"]: true }} style={catColor ? { color: catColor } : undefined}>
                  {w.text.split("").map((ch, i) => {
                    if (i < w.typed.length) {
                      const isCorrect = w.typed[i] === ch;
                      return <letter class={isCorrect ? "correct" : "incorrect"}>{w.typed[i]}</letter>;
                    }
                    return <letter>{ch}</letter>;
                  })}
                  {w.typed.length > w.text.length && (
                    <letter class="incorrect extra">{w.typed.slice(w.text.length)}</letter>
                  )}
                  <span class="result-history-space"> </span>
                </span>
              );
              })}
            </div>
          </div>

          <Show when={s.replayData && s.replayData.length > 0 && showReplay()}>
            <ReplayView replayData={s.replayData!} words={s.replayWords ?? []} />
          </Show>

          <div class="buttons">
            <button class="text" id="nextTestButton" onClick={props.onRestart} aria-label="Next test" role="button" data-balloon-pos="down">
              <i class="fas fa-fw fa-chevron-right"></i>
            </button>
            <button class="text" id="restartTestButtonWithSameWordset" onClick={props.onRepeat} aria-label="Repeat test" role="button" data-balloon-pos="down">
              <i class="fas fa-fw fa-sync-alt"></i>
            </button>
            <button class="text" id="practiseWordsButton" onClick={props.onPractice} aria-label="Practice words" role="button" data-balloon-pos="down">
              <i class="fas fa-fw fa-exclamation-triangle"></i>
            </button>
            <button class="text" id="showWordHistoryButton" classList={{ active: showWordHistory() }} onClick={() => setShowWordHistory(p => !p)} aria-label="Toggle words history" role="button" data-balloon-pos="down">
              <i class="fas fa-fw fa-align-left"></i>
            </button>
            <button class="text" id="watchReplayButton" classList={{ active: showReplay() }} onClick={() => { setShowReplay(p => !p); if (!showReplay()) setShowWordHistory(false); }} aria-label="Watch replay" role="button" data-balloon-pos="down">
              <i class="fas fa-fw fa-backward"></i>
            </button>
            <button class="text" id="saveScreenshotButton" onClick={handleScreenshot} aria-label="Copy screenshot to clipboard&#10;(shift click to download)" role="button" data-balloon-pos="down" data-balloon-break>
              <i class="far fa-fw fa-image"></i>
            </button>
          </div>
        </div>

        <div class="loginTip">
          <a href="/login">Sign in</a> to save your result
        </div>

        <div class="ssWatermark hidden">phoenixtype.com</div>
      </div>

      <div class="full-width" style="margin-top: 1rem">
        <div id="ad-result-wrapper" class="ad full-width advertisement ad-h">
          <div class="iconAndText">
            <div class="icon"><i class="fas fa-ad"></i></div>
            <div class="text textRight"></div>
          </div>
          <div id="ad-result"></div>
        </div>
        <div id="ad-result-small-wrapper" class="ad advertisement ad-h-s">
          <div class="icon small"><i class="fas fa-ad"></i></div>
          <div id="ad-result-small"></div>
        </div>
      </div>

      <Show when={avgWpm() > 0 && configStore.showAverage !== "off"}>
        <div class="result-avg">
          {(configStore.showAverage === "speed" || configStore.showAverage === "both") && (
            <span class="result-avg-wpm">{avgWpm()} wpm avg</span>
          )}
          {configStore.showAverage === "both" && <span class="result-avg-sep">·</span>}
          {(configStore.showAverage === "acc" || configStore.showAverage === "both") && (
            <span class="result-avg-acc">{avgAcc()}% acc avg</span>
          )}
        </div>
      </Show>
    </div>
  );
}
