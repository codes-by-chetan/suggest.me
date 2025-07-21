// utils/navigate-back.ts
export const navigateBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/'; // or use a known fallback path
  }
};
