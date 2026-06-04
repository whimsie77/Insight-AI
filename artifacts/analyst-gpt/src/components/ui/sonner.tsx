import { Toaster as Sonner } from "sonner";

const Toaster = () => (
  <Sonner
    theme="dark"
    richColors
    position="bottom-right"
    toastOptions={{
      classNames: {
        toast: "!bg-slate-800 !border-slate-700 !text-slate-100",
        description: "!text-slate-400",
      },
    }}
  />
);

export { Toaster };
