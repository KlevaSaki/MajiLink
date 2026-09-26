import { toast } from "sonner";

// The rest of the app imports from here, never from "sonner" directly —
// keeps MajiLink's styling in one place and makes swapping the
// underlying library later a one-file change instead of a find-replace
// across every store.

export function showError(message: string) {
  toast.error(message, {
    style: {
      background: "#FEF2F2",
      color: "#B91C1C",
      border: "1px solid #FECACA",
    },
  });
}

export function showSuccess(message: string) {
  toast.success(message, {
    style: {
      background: "#E1F5EE",
      color: "#0F6E56",
      border: "1px solid #4FD1C5",
    },
  });
}

export function showInfo(message: string) {
  toast(message, {
    style: {
      background: "#FAFAF8",
      color: "#134E4A",
      border: "1px solid #D6D3D1",
    },
  });
}
