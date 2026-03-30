import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  StickyNote,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";
import { useCreateNote, useMyNotes, usePatchNote } from "../../apis/api/notes";
import type { StickyNote as StickyNoteType } from "../../types/notes.types";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import {
  STICKY_COLOR_OPTIONS,
  stickyCardClasses,
  type StickyColorId,
} from "../../utils/stickyNoteTheme";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function ColorSwatches({
  value,
  onChange,
  size = "md",
}: {
  value: StickyColorId;
  onChange: (c: StickyColorId) => void;
  size?: "sm" | "md";
}) {
  const btn =
    size === "sm"
      ? "h-6 w-6 ring-2 ring-offset-1"
      : "h-9 w-9 ring-2 ring-offset-2";
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Note color">
      {STICKY_COLOR_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="listitem"
          title={opt.label}
          onClick={() => onChange(opt.id)}
          className={`
            rounded-full shadow-sm transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
            ${opt.swatch}
            ${btn}
            ${value === opt.id ? "ring-violet-600 ring-offset-white" : "ring-transparent ring-offset-transparent"}
          `}
        />
      ))}
    </div>
  );
}

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.12;

function randomBoardPosition(): { positionX: number; positionY: number } {
  return {
    positionX: 12 + Math.random() * 48,
    positionY: 10 + Math.random() * 38,
  };
}

type DragSession = {
  id: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  boardW: number;
  boardH: number;
  el: HTMLElement;
};

export default function StickyNotes() {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragSession = useRef<DragSession | null>(null);
  const zoomRef = useRef(1);

  const [panelOpen, setPanelOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createColor, setCreateColor] = useState<StickyColorId>("lemon");

  const [zoom, setZoom] = useState(1);

  const { data, isLoading, isError, error } = useMyNotes(false);
  const createMut = useCreateNote();
  const patchMut = usePatchNote();
  const patchMutRef = useRef(patchMut);
  patchMutRef.current = patchMut;
  const notes = data?.notes ?? [];
  zoomRef.current = zoom;

  function notePosition(note: StickyNoteType) {
    return {
      x: note.positionX ?? 12,
      y: note.positionY ?? 12,
    };
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = dragSession.current;
      if (!s) return;
      e.preventDefault();
      const dx = e.clientX - s.startClientX;
      const dy = e.clientY - s.startClientY;
      const z = zoomRef.current;
      s.el.style.transform = `translate3d(${dx / z}px, ${dy / z}px, 0)`;
    };
    const finishDrag = (e: PointerEvent) => {
      const s = dragSession.current;
      if (!s) return;
      dragSession.current = null;
      const dxPct = ((e.clientX - s.startClientX) / s.boardW) * 100;
      const dyPct = ((e.clientY - s.startClientY) / s.boardH) * 100;
      const nx = clamp(s.originX + dxPct, 0, 82);
      const ny = clamp(s.originY + dyPct, 0, 78);
      s.el.style.transform = "";
      s.el.style.zIndex = "";
      s.el.style.willChange = "";
      s.el.classList.remove("sticky-note--dragging");
      document.body.style.userSelect = "";
      patchMutRef.current.mutate(
        { id: s.id, body: { positionX: nx, positionY: ny } },
        {
          onError: (err) => {
            toast.error(
              (err as ApiError)?.message ?? "Could not save position"
            );
          },
        }
      );
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => clamp(z + delta, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomOut = () =>
    setZoom((z) => clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomIn = () =>
    setZoom((z) => clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomReset = () => setZoom(1);

  const handleGripDown = useCallback(
    (e: ReactPointerEvent, note: StickyNoteType) => {
      if (!boardRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const article = (e.currentTarget as HTMLElement).closest(
        "[data-sticky-note]"
      ) as HTMLElement | null;
      if (!article) return;

      const br = boardRef.current.getBoundingClientRect();
      const pos = notePosition(note);
      dragSession.current = {
        id: note._id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        boardW: br.width,
        boardH: br.height,
        el: article,
      };
      article.style.zIndex = "60";
      article.style.willChange = "transform";
      article.classList.add("sticky-note--dragging");
      document.body.style.userSelect = "none";
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* older browsers */
      }
    },
    []
  );

  const handleColorChange = (noteId: string, color: StickyColorId) => {
    patchMut.mutate(
      { id: noteId, body: { color } },
      {
        onError: (err) => {
          toast.error((err as ApiError)?.message ?? "Could not update color");
        },
      }
    );
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const t = createTitle.trim();
    const c = createContent.trim();
    if (!t || !c) {
      toast.error("Title and note text are required.");
      return;
    }
    try {
      const pos = randomBoardPosition();
      await createMut.mutateAsync({
        title: t,
        content: c,
        color: createColor,
        positionX: pos.positionX,
        positionY: pos.positionY,
      });
      toast.success("Sticky added to your board");
      setCreateTitle("");
      setCreateContent("");
      setCreateColor("lemon");
      setPanelOpen(false);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not save note");
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-2 border-b border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            <StickyNote className="h-6 w-6 shrink-0 text-amber-500" aria-hidden />
            Sticky notes
          </h2>
          <p className="text-xs text-gray-500 sm:text-sm">
            Drag by the grip.{" "}
            <span className="hidden sm:inline">
              Zoom: buttons or Ctrl/⌘ + scroll. New sticky opens the side panel.
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div
            className="flex items-center gap-0.5 rounded-xl border border-gray-200/90 bg-white/95 p-0.5 shadow-sm"
            role="group"
            aria-label="Board zoom"
          >
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN + 0.001}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-35"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[2.85rem] px-1 text-center text-xs font-semibold tabular-nums text-gray-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX - 0.001}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-35"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomReset}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              title="Reset zoom (100%)"
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setPanelOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 shadow-[0_8px_24px_rgba(109,40,217,0.22)]"
          >
            <Plus className="h-4 w-4" />
            New sticky
          </Button>
        </div>
      </div>

      <section
        ref={boardRef}
        aria-label="Sticky note board"
        className="relative min-h-0 flex-1 overflow-auto bg-[linear-gradient(to_bottom,rgb(248,250,252)_0%,rgb(241,245,249)_42%,rgb(236,241,247)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-gray-200/50"
      >
        <div
          className="relative origin-top-left will-change-transform"
          style={{
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            minHeight: "100%",
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(203,213,225)_1px,transparent_0)] [background-size:24px_24px] opacity-[0.35]" />
          <div className="relative h-full min-h-full min-w-full w-full">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              Loading your board…
            </div>
          ) : isError ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
                {(error as Error)?.message ?? "Could not load notes."}
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <StickyNote className="h-12 w-12 text-gray-300" />
              <p className="max-w-sm text-sm text-gray-500">
                Your board is empty. Click{" "}
                <span className="font-medium text-gray-700">New sticky</span>{" "}
                to add a note—it will appear here and you can drag it
                anywhere.
              </p>
            </div>
          ) : (
            notes.map((note) => {
              const { x, y } = notePosition(note);
              const card = stickyCardClasses(note.color);
              return (
                <article
                  key={note._id}
                  data-sticky-note
                  className={`
                    absolute w-[min(15.5rem,calc(100vw-3rem))] max-w-[248px] rounded-xl border bg-gradient-to-br p-0
                    shadow-[3px_3px_0_rgba(15,23,42,0.07),0_12px_28px_rgba(15,23,42,0.06)]
                    z-10
                    ${card}
                  `}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="flex cursor-grab touch-none items-center gap-1.5 border-b border-black/5 bg-black/[0.03] px-2 py-1.5 active:cursor-grabbing"
                    onPointerDown={(e) => handleGripDown(e, note)}
                    role="presentation"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-gray-500/80" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Drag
                    </span>
                  </div>
                  <div className="px-3 pb-2 pt-2">
                    <h3 className="text-sm font-bold leading-snug">{note.title}</h3>
                    <p className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed opacity-90">
                      {note.content}
                    </p>
                    {note.updatedAt ? (
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide opacity-55">
                        {formatWhen(note.updatedAt)}
                      </p>
                    ) : null}
                    <div
                      className="mt-3 flex items-center gap-1.5 border-t border-black/5 pt-2"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-medium text-gray-600/90">
                        Color
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {STICKY_COLOR_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            title={opt.label}
                            disabled={patchMut.isPending}
                            onClick={() => handleColorChange(note._id, opt.id)}
                            className={`
                              h-5 w-5 shrink-0 rounded-full transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                              ${opt.swatch}
                              ${(note.color ?? "lemon") === opt.id ? "ring-2 ring-violet-600 ring-offset-1" : "ring-1 ring-black/10"}
                            `}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          </div>
        </div>
      </section>

      {/* Floating action (mobile-friendly) */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_40px_rgba(109,40,217,0.45)] transition hover:bg-violet-700 hover:shadow-lg lg:hidden"
        aria-label="New sticky note"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Right slide-over */}
      <div
        className={`fixed inset-0 z-[100] transition ${panelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity ${panelOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setPanelOpen(false)}
          aria-label="Close panel"
        />
        <div
          className={`
            absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out
            ${panelOpen ? "translate-x-0" : "translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sticky-panel-title"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2
              id="sticky-panel-title"
              className="text-lg font-semibold text-gray-900"
            >
              New sticky
            </h2>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5"
          >
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Color</p>
              <ColorSwatches value={createColor} onChange={setCreateColor} />
            </div>
            <Input
              label="Title"
              name="title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Short headline"
              autoComplete="off"
            />
            <Input
              label="Note"
              name="content"
              type="textarea"
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
              placeholder="Your reminder…"
            />
            <div className="mt-auto flex gap-2 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPanelOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={createMut.isPending}
              >
                {createMut.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
