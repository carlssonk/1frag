import create from "zustand";

type BindingsState = {
  isPointerLocked: boolean;
  setIsPointerLocked: (bool: boolean) => unknown;
  resumeButtonDom: HTMLElement | null;
  setResumeButtonDom: (element: HTMLElement) => unknown;
};

export const useBindings = create<BindingsState>((set) => ({
  isPointerLocked: true,
  setIsPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  resumeButtonDom: null,
  setResumeButtonDom: (resumeButtonDom) => set({ resumeButtonDom }),
}));
