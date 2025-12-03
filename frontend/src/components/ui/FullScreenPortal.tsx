// components/ui/FullScreenPortal.tsx
import { createPortal } from "react-dom";

export const FullScreenPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
