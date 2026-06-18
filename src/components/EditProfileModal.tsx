import { createSignal, Show, For, onCleanup, onMount } from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import { profileStore, updateProfile } from "../lib/profile-store";
import { AVATARS, PREMIUM_AVATARS, PET_AVATARS, ANIMAL_AVATARS, DEFAULT_AVATAR_ID } from "../lib/avatars";
import { getUserData, updateUserDoc } from "../lib/user-store";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal(props: Props) {
  const { store: authStore } = useAuth();

  function stripUrl(val: string): string {
    return val.replace(/^https?:\/\/(www\.)?(github\.com|twitter\.com|x\.com|instagram\.com)\//i, "").replace(/\/.*$/, "").trim();
  }

  const [bio, setBio] = createSignal("");
  const [keyboard, setKeyboard] = createSignal("");
  const [github, setGithub] = createSignal("");
  const [twitter, setTwitter] = createSignal("");
  const [instagram, setInstagram] = createSignal("");
  const [website, setWebsite] = createSignal("");
  const [avatarId, setAvatarId] = createSignal(DEFAULT_AVATAR_ID);
  const [customAvatar, setCustomAvatar] = createSignal("");
  const [showActivity, setShowActivity] = createSignal(true);

  onMount(async () => {
    if (!authStore.user?.uid) return;
    const d = await getUserData(authStore.user.uid);
    if (d) {
      setBio(d.bio || "");
      setKeyboard(d.keyboard || "");
      setGithub(d.github || "");
      setTwitter(d.twitter || "");
      setInstagram(d.instagram || "");
      setWebsite(d.website || "");
      setAvatarId(d.avatarId);
      setCustomAvatar(d.customAvatar || "");
      setShowActivity(d.showActivityOnPublicProfile);
    }
  });
  const [showPresets, setShowPresets] = createSignal(false);
  const [avatarTab, setAvatarTab] = createSignal<"free" | "premium" | "pets" | "animals">("free");
  const [avatarError, setAvatarError] = createSignal("");
  const [cropSrc, setCropSrc] = createSignal("");
  const [cropZoom, setCropZoom] = createSignal(1);
  const [cropOffset, setCropOffset] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const cropRef = (el: HTMLDivElement) => {
    const onMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - cropOffset().x, y: e.clientY - cropOffset().y });
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - cropOffset().x, y: t.clientY - cropOffset().y });
    };
    el?.addEventListener("mousedown", onMouseDown);
    el?.addEventListener("touchstart", onTouchStart);
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging()) return;
      setCropOffset({ x: e.clientX - dragStart().x, y: e.clientY - dragStart().y });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging()) return;
      const t = e.touches[0];
      setCropOffset({ x: t.clientX - dragStart().x, y: t.clientY - dragStart().y });
    };
    const onEnd = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);
    onCleanup(() => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    });
  };
  const CROP_SIZE = 240;

  const handleFile = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("File too large (max 5MB)");
      input.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Not an image file");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    input.value = "";
  };

  const handleCropSave = () => {
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const sz = 200;
      const z = cropZoom();
      const off = cropOffset();
      const coverScale = Math.max(240 / nw, 240 / nh);
      const dX = off.x * z;
      const dY = off.y * z;
      const visSize = 240 / (z * coverScale);
      const cx = nw / 2 - dX / coverScale;
      const cy = nh / 2 - dY / coverScale;
      const canvas = document.createElement("canvas");
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, cx - visSize / 2, cy - visSize / 2, visSize, visSize, 0, 0, sz, sz);
      setCustomAvatar(canvas.toDataURL("image/jpeg", 0.9));
      setCropSrc("");
      setShowPresets(false);
    };
    img.src = cropSrc();
  };

  const handleCropCancel = () => {
    setCropSrc("");
  };

  const handleRemoveAvatar = () => {
    setCustomAvatar("");
    setAvatarId(DEFAULT_AVATAR_ID);
    setShowPresets(false);
  };

  const currentAvatarSrc = () => {
    const ca = customAvatar();
    if (ca) return ca;
    const av = [...AVATARS, ...PREMIUM_AVATARS, ...PET_AVATARS, ...ANIMAL_AVATARS].find(a => a.id === avatarId());
    return av ? av.src : AVATARS[DEFAULT_AVATAR_ID].src;
  };

  const handleSave = () => {
    updateProfile({
      bio: bio(),
      keyboard: keyboard(),
      github: github(),
      twitter: twitter(),
      instagram: instagram(),
      website: website(),
      avatarId: avatarId(),
      customAvatar: customAvatar(),
      showActivityOnPublicProfile: showActivity(),
    });
    if (authStore.user) {
      updateUserDoc(authStore.user.uid, {
        bio: bio(),
        keyboard: keyboard(),
        github: github(),
        twitter: twitter(),
        instagram: instagram(),
        website: website(),
        avatarId: avatarId(),
        customAvatar: customAvatar(),
        showActivityOnPublicProfile: showActivity(),
      });
    }
    props.onClose();
  };

  return (
    <Show when={props.open}>
      <div class="edit-profile-overlay" onClick={props.onClose}>
        <div class="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div class="edit-profile-header">
            <h2>Edit Profile</h2>
            <button class="edit-profile-close" onClick={props.onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <div class="edit-profile-body">
            {/* Name - read only */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">name</label>
              <div class="edit-profile-readonly">
                To update your name, go to Account Settings &gt; Account &gt; Update account name
              </div>
            </div>

            {/* Avatar */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">avatar</label>
              <div class="edit-profile-avatar-section">
                <div class="edit-profile-avatar-preview">
                  <img src={currentAvatarSrc()} alt="avatar" />
                </div>
                <div class="edit-profile-avatar-actions">
                  <label class="edit-profile-btn edit-profile-btn-secondary">
                    upload photo
                    <input type="file" accept="image/*" onChange={handleFile} />
                  </label>
                  <button class="edit-profile-btn edit-profile-btn-secondary" onClick={() => setShowPresets(v => !v)}>
                    {showPresets() ? "hide presets" : "use preset"}
                  </button>
                  <Show when={customAvatar() || avatarId() !== DEFAULT_AVATAR_ID}>
                    <button class="edit-profile-btn edit-profile-btn-danger" onClick={handleRemoveAvatar}>
                      reset
                    </button>
                  </Show>
                </div>
              </div>
              <Show when={cropSrc()}>
                <div class="edit-profile-crop">
                  <div class="edit-profile-crop-label">crop photo</div>
                  <div class="edit-profile-crop-container" ref={cropRef}>
                    <img
                      src={cropSrc()}
                      alt="crop preview"
                      style={{
                        transform: `scale(${cropZoom()}) translate(${cropOffset().x / cropZoom()}px, ${cropOffset().y / cropZoom()}px)`,
                        cursor: isDragging() ? "grabbing" : "grab",
                      }}
                    />
                  </div>
                  <div class="edit-profile-crop-zoom">
                    <span>zoom</span>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.05"
                      value={cropZoom()}
                      onInput={(e) => setCropZoom(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>{Math.round(cropZoom() * 100)}%</span>
                  </div>
                  <div class="edit-profile-crop-actions">
                    <button class="edit-profile-btn edit-profile-btn-secondary" onClick={handleCropCancel}>cancel</button>
                    <button class="edit-profile-btn edit-profile-btn-primary" onClick={handleCropSave}>save</button>
                  </div>
                </div>
              </Show>
              <Show when={avatarError()}>
                <div class="edit-profile-error">{avatarError()}</div>
              </Show>
              <Show when={!cropSrc() && showPresets()}>
                <div class="edit-profile-avatar-tabs">
                  <button
                    class="edit-profile-avatar-tab"
                    classList={{ "edit-profile-avatar-tab-active": avatarTab() === "free" }}
                    onClick={() => setAvatarTab("free")}
                  >Free ({AVATARS.length})</button>
                  <button
                    class="edit-profile-avatar-tab"
                    classList={{ "edit-profile-avatar-tab-active": avatarTab() === "premium" }}
                    onClick={() => setAvatarTab("premium")}
                  >Premium ({PREMIUM_AVATARS.length}) ⭐</button>
                  <button
                    class="edit-profile-avatar-tab"
                    classList={{ "edit-profile-avatar-tab-active": avatarTab() === "pets" }}
                    onClick={() => setAvatarTab("pets")}
                  >Pets ({PET_AVATARS.length}) 🐾</button>
                  <button
                    class="edit-profile-avatar-tab"
                    classList={{ "edit-profile-avatar-tab-active": avatarTab() === "animals" }}
                    onClick={() => setAvatarTab("animals")}
                  >Animals ({ANIMAL_AVATARS.length})</button>
                </div>
                <Show when={avatarTab() === "free"}>
                  <div class="edit-profile-avatar-grid">
                    <For each={AVATARS}>
                      {(av) => (
                        <button
                          class="edit-profile-avatar-btn"
                          classList={{ "edit-profile-avatar-selected": avatarId() === av.id && !customAvatar() }}
                          onClick={() => { setAvatarId(av.id); setCustomAvatar(""); }}
                          title={av.name}
                        >
                          <img src={av.src} alt={av.name} />
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={avatarTab() === "premium"}>
                  <div class="edit-profile-avatar-grid edit-profile-avatar-grid-premium">
                    <For each={PREMIUM_AVATARS}>
                      {(av) => (
                        <button
                          class="edit-profile-avatar-btn edit-profile-avatar-btn-premium"
                          classList={{ "edit-profile-avatar-selected": avatarId() === av.id && !customAvatar() }}
                          onClick={() => { setAvatarId(av.id); setCustomAvatar(""); }}
                          title={av.name}
                        >
                          <img src={av.src} alt={av.name} />
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={avatarTab() === "pets"}>
                  <div class="edit-profile-avatar-grid edit-profile-avatar-grid-pets">
                    <For each={PET_AVATARS}>
                      {(av) => (
                        <button
                          class="edit-profile-avatar-btn edit-profile-avatar-btn-pet"
                          classList={{ "edit-profile-avatar-selected": avatarId() === av.id && !customAvatar() }}
                          onClick={() => { setAvatarId(av.id); setCustomAvatar(""); }}
                          title={av.name}
                        >
                          <img src={av.src} alt={av.name} />
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={avatarTab() === "animals"}>
                  <div class="edit-profile-avatar-grid edit-profile-avatar-grid-animals">
                    <For each={ANIMAL_AVATARS}>
                      {(av) => (
                        <button
                          class="edit-profile-avatar-btn edit-profile-avatar-btn-animal"
                          classList={{ "edit-profile-avatar-selected": avatarId() === av.id && !customAvatar() }}
                          onClick={() => { setAvatarId(av.id); setCustomAvatar(""); }}
                          title={av.name}
                        >
                          <img src={av.src} alt={av.name} />
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </Show>
            </div>

            {/* Bio */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">bio</label>
              <textarea
                class="edit-profile-textarea"
                value={bio()}
                onInput={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                maxLength={250}
                rows={3}
              />
              <div class="edit-profile-charcount">{bio().length}/250</div>
            </div>

            {/* Keyboard */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">keyboard</label>
              <textarea
                class="edit-profile-textarea"
                value={keyboard()}
                onInput={(e) => setKeyboard((e.target as HTMLTextAreaElement).value)}
                maxLength={75}
                rows={2}
              />
              <div class="edit-profile-charcount">{keyboard().length}/75</div>
            </div>

            {/* GitHub */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">github</label>
              <input
                class="edit-profile-input"
                type="text"
                value={github()}
                onInput={(e) => setGithub(stripUrl((e.target as HTMLInputElement).value))}
                maxLength={39}
                placeholder="username"
              />
            </div>

            {/* Twitter */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">twitter</label>
              <input
                class="edit-profile-input"
                type="text"
                value={twitter()}
                onInput={(e) => setTwitter(stripUrl((e.target as HTMLInputElement).value))}
                maxLength={15}
                placeholder="username"
              />
            </div>

            {/* Instagram */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">instagram</label>
              <input
                class="edit-profile-input"
                type="text"
                value={instagram()}
                onInput={(e) => setInstagram(stripUrl((e.target as HTMLInputElement).value))}
                maxLength={30}
                placeholder="username"
              />
            </div>

            {/* Website */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">website</label>
              <input
                class="edit-profile-input"
                type="text"
                value={website()}
                onInput={(e) => setWebsite((e.target as HTMLInputElement).value)}
                maxLength={200}
              />
            </div>

            {/* Public Activity */}
            <div class="edit-profile-field">
              <label class="edit-profile-label">public activity</label>
              <label class="edit-profile-checkbox">
                <input
                  type="checkbox"
                  checked={showActivity()}
                  onChange={(e) => setShowActivity((e.target as HTMLInputElement).checked)}
                />
                <span class="edit-profile-checkmark"></span>
                Include test activity graph on your public profile.
              </label>
            </div>
          </div>

          <div class="edit-profile-footer">
            <button class="edit-profile-btn edit-profile-btn-primary" onClick={handleSave}>
              save
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
