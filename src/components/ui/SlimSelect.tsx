import type { JSXElement } from "solid-js";
import SlimSelectCore, { Config } from "slim-select";
import { Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import { areUnsortedArraysEqual } from "../../utils/arrays";

function updateSlimSelectData(
  slimSelect: SlimSelectCore,
  data: (Partial<Option> | Partial<Option>)[],
  scheduleRender = false,
): void {
  slimSelect.store.setData(data as Option[]);
  if (scheduleRender) {
    requestAnimationFrame(() => {
      if (!slimSelect) return;
      slimSelect.render.renderValues();
      const freshData = slimSelect.store.getData();
      slimSelect.render.renderOptions(freshData as Option[]);
    });
  }
}

export type SlimSelectProps = {
  options?: Pick<Option, "value" | "text">[];
  settings?: Config["settings"] & { scrollToTop?: boolean; addAllOption?: boolean };
  events?: Config["events"];
  cssClasses?: Config["cssClasses"];
  disabled?: boolean;
  appendTo?: "body" | "container";
} & (
  | {
      multiple?: never;
      onChange?: (selected: string | undefined) => void;
      selected?: string;
    }
  | {
      multiple: true;
      onChange?: (selected: string[]) => void;
      selected?: string[];
    }
);

export default function SlimSelect(props: SlimSelectProps): JSXElement {
  let selectRef!: HTMLSelectElement;
  let containerRef!: HTMLDivElement;
  let slimSelect: SlimSelectCore | null = null;

  const [isInitialMount, setIsInitialMount] = createSignal(true);
  const [isInitializing, setIsInitializing] = createSignal(true);

  const getSelected = () =>
    props.selected === undefined
      ? []
      : props.multiple
        ? props.selected
        : [props.selected];

  let currentSelected: string[] = getSelected();
  let lastOptionsReference: typeof props.options | undefined = undefined;
  let isActiveInstance = false;
  let userChangeTimeoutId: number | undefined;

  const getOptions = (): Pick<Option, "value" | "text">[] => {
    if (props.options) return props.options;
    return [];
  };

  const getInitialData = (): (Partial<Option> | Partial<Option>)[] => {
    return getDataWithAll(buildData(getOptions(), getSelected()));
  };

  const buildData = (
    options: Pick<Option, "value" | "text">[] = [],
    selected: string[] = [],
  ): Partial<Option>[] => {
    const selectedSet = new Set(selected);
    return options.map((option) => ({
      ...option,
      selected: selectedSet.has(option.value),
    }));
  };

  const getAllOptionValues = (
    data: (Partial<Option> | Partial<Option>)[],
  ): string[] => {
    const items = data.filter((o) => "value" in o && o.value !== "all" && !o.placeholder) as Partial<Option>[];
    return items.map((o) => o.value as string);
  };

  const getDataWithAll = (data: Partial<Option>[]): Partial<Option>[] => {
    if (!props.settings?.addAllOption || !props.multiple) return data;
    return [{ value: "all", text: "all", selected: false }, ...data];
  };

  const syncSelectedToSlimSelect = (selected: string[], runAfterChange = false): void => {
    if (!slimSelect) return;
    slimSelect.setSelected(selected ?? [], runAfterChange);
  };

  const renderAllState = (data: (Partial<Option> | Partial<Option>)[]): void => {
    if (!slimSelect) return;
    const allValues = getAllOptionValues(data);
    const allValuesSet = new Set(allValues);
    for (const item of data) {
      if (!("value" in item)) continue;
      item.selected = item.value === "all";
    }
    slimSelect.store.setData(data as Option[]);
    slimSelect.render.renderValues();
    for (const item of data) {
      if (!("value" in item)) continue;
      item.selected = item.value === "all" || (typeof item.value === "string" && allValuesSet.has(item.value));
    }
    requestAnimationFrame(() => {
      if (!slimSelect) return;
      slimSelect.store.setData(data as Option[]);
      const freshData = slimSelect.store.getData();
      slimSelect.render.renderOptions(freshData as Option[]);
    });
  };

  const handleAllSelection = (
    selectedOptions: Option[],
    oldSelectedOptions: Option[],
  ): false | undefined => {
    if (!props.settings?.addAllOption || !props.multiple || !slimSelect) return;
    const includesAllNow = selectedOptions.some((o) => o.value === "all");
    const includedAllBefore = oldSelectedOptions.some((o) => o.value === "all");
    if (!includesAllNow && !includedAllBefore) return;
    const data = slimSelect.store.getData();
    const allValues = getAllOptionValues(data);
    const allValuesSet = new Set(allValues);
    if (includesAllNow && !includedAllBefore) {
      renderAllState(data);
      if (props.onChange && props.multiple && !areUnsortedArraysEqual(allValues, currentSelected)) {
        (props.onChange as (selected: string[]) => void)(allValues);
        currentSelected = allValues;
      }
      return false;
    }
    if (includesAllNow && selectedOptions.length > oldSelectedOptions.length) {
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = item.value !== "all" && allValuesSet.has(item.value);
      }
      updateSlimSelectData(slimSelect, data, true);
      return false;
    }
    if (includesAllNow && selectedOptions.length < oldSelectedOptions.length) {
      const newSelection = selectedOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value);
      const newSelectionSet = new Set(newSelection);
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = newSelectionSet.has(item.value);
      }
      updateSlimSelectData(slimSelect, data, true);
      if (props.onChange && props.multiple && !areUnsortedArraysEqual(newSelection, currentSelected)) {
        (props.onChange as (selected: string[]) => void)(newSelection);
        currentSelected = newSelection;
      }
      return false;
    }
    if (!includesAllNow && includedAllBefore) {
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = false;
      }
      updateSlimSelectData(slimSelect, data, true);
      if (props.onChange && props.multiple && currentSelected.length > 0) {
        (props.onChange as (selected: string[]) => void)([]);
        currentSelected = [];
      }
      return false;
    }
    return;
  };

  onMount(() => {
    const ogAfterChange = props.events?.afterChange;
    const ogBeforeChange = props.events?.beforeChange;
    const ogBeforeOpen = props.events?.beforeOpen;

    const config: Config = {
      select: selectRef,
      data: getInitialData() as Option[],
      settings: {
        ...props.settings,
        ...(props.appendTo === "container" && { contentLocation: containerRef }),
      },
      ...(props.cssClasses && { cssClasses: props.cssClasses }),
      events: {
        ...props.events,
        beforeChange: (selectedOptions, oldSelectedOptions) => {
          isActiveInstance = true;
          if (ogBeforeChange?.(selectedOptions, oldSelectedOptions) === false) return false;
          const result = handleAllSelection(selectedOptions, oldSelectedOptions);
          if (result !== undefined) return result;
          return true;
        },
        afterChange: (newVal) => {
          if (!slimSelect) return;
          let newValue = newVal.map((o) => o.value);
          if (props.settings?.addAllOption && Array.isArray(newValue)) {
            if (newValue.length === 1 && newValue[0] === "all") {
              newValue = getAllOptionValues(slimSelect.store.getData());
            } else {
              newValue = newValue.filter((v) => v !== "all");
            }
          }
          const slimData = slimSelect.store.getData();
          const options = slimData.flatMap((item) => ("label" in item ? item.options : [item]));
          const valueChanged = !areUnsortedArraysEqual(newValue, currentSelected);
          const currentValueExists = currentSelected.length > 0 && currentSelected.every((v) => options.some((o) => o.value === v));
          const newValueIsValid = newValue.length > 0 && newValue.every((v) => options.some((o) => o.value === v));
          if (props.onChange && valueChanged && (currentValueExists || newValueIsValid)) {
            if (props.multiple) {
              (props.onChange as (selected: string[]) => void)(newValue);
            } else {
              (props.onChange as (selected: string) => void)(newValue[0] ?? "");
            }
            currentSelected = newValue;
          }
          ogAfterChange?.(newVal);
          if (userChangeTimeoutId !== undefined) clearTimeout(userChangeTimeoutId);
          userChangeTimeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
              isActiveInstance = false;
              userChangeTimeoutId = undefined;
            });
          }, 150) as unknown as number;
        },
        beforeOpen: () => {
          if (!slimSelect) return;
          if (props.settings?.scrollToTop) {
            const listElement = slimSelect.render.content.list;
            const topListItem = listElement.children.item(0) as HTMLElement | null;
            if (topListItem) {
              listElement.scrollTop = topListItem.offsetTop - listElement.offsetTop;
            }
          }
          ogBeforeOpen?.();
        },
      },
    };

    slimSelect = new SlimSelectCore(config);
    lastOptionsReference = props.options;

    if (props.disabled) slimSelect.disable();
    if (props.selected !== undefined) syncSelectedToSlimSelect(getSelected(), false);
    setIsInitialMount(false);

    requestAnimationFrame(() => {
      if ((!props.options) || !slimSelect) {
        setIsInitializing(false);
        return;
      }
      const initialData = slimSelect.store.getData();
      const selectedOptions = initialData
        .flatMap((item) => ("label" in item ? item.options : [item]))
        .filter((item) => item.selected);
      if (selectedOptions.length > 0) {
        let initialValue = selectedOptions.map((o) => o.value);
        if (props.settings?.addAllOption) {
          if (initialValue.length === 1 && initialValue[0] === "all") {
            initialValue = getAllOptionValues(initialData);
          } else {
            initialValue = initialValue.filter((v) => v !== "all");
          }
        }
        currentSelected = initialValue;
      }
      requestAnimationFrame(() => setIsInitializing(false));
    });
  });

  onCleanup(() => {
    slimSelect?.destroy();
    slimSelect = null;
  });

  createEffect(() => {
    const selected = getSelected();
    if (isInitialMount()) {
      currentSelected = selected;
      return;
    }
    if (props.selected === undefined) return;
    if (slimSelect && selected !== undefined) {
      currentSelected = selected;
      if (props.settings?.addAllOption && props.multiple) {
        const options = getOptions();
        const selectedSet = new Set(selected);
        const allAreSelected = options.length > 0 && selected.length === options.length && options.every((opt) => selectedSet.has(opt.value));
        if (allAreSelected) {
          renderAllState(slimSelect.store.getData());
          return;
        }
      }
      syncSelectedToSlimSelect(selected, false);
    }
  });

  createEffect(() => {
    const options = getOptions();
    const selected = getSelected();
    if (!isInitialMount() && slimSelect && options.length > 0) {
      if (options === lastOptionsReference) return;
      if (isInitializing()) return;
      if (isActiveInstance) return;
      const data = buildData(options, selected ?? []);
      slimSelect.store.setData(getDataWithAll(data) as Option[]);
      if (props.settings?.addAllOption && props.multiple) {
        const storeData = slimSelect.store.getData();
        const allPossibleValues = getAllOptionValues(storeData);
        const allAreSelected = allPossibleValues.length > 0 && (selected?.length ?? 0) === allPossibleValues.length;
        if (allAreSelected) {
          renderAllState(storeData);
          lastOptionsReference = options;
          return;
        }
      }
      slimSelect.render.renderValues();
      slimSelect.render.renderOptions(slimSelect.store.getData());
      lastOptionsReference = options;
      if (props.selected !== undefined) syncSelectedToSlimSelect(getSelected(), false);
    }
  });

  createEffect(() => {
    if (!slimSelect) return;
    if (props.disabled) slimSelect.disable(); else slimSelect.enable();
  });

  return (
    <div
      ref={(el) => (containerRef = el)}
      class={`relative${props.appendTo === "container" ? " [&>.ss-content]:top-full! [&>.ss-content]:left-0! [&>.ss-content]:w-full!" : ""}`}
    >
      <select ref={(el) => (selectRef = el)} multiple={props.multiple} />
    </div>
  );
}
