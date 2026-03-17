export function scrollToTop(behavior: ScrollBehavior = "smooth") {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior });
  }
}

export default scrollToTop;
