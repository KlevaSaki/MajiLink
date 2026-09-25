import { useState } from "react";
import { Phone, ClipboardList, CheckCircle2, Bike, Home, Store, Check, Wallet } from "lucide-react";
import type { Order, OrderStatus } from "../../../types/index";
import PaymentPrompt from "./PaymentPrompt";

interface Step {
  key: OrderStatus;
  label: string;
  Icon: typeof ClipboardList;
}

const STEPS: Step[] = [
  { key: "pending", label: "Placed", Icon: ClipboardList },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "en_route", label: "En route", Icon: Bike },
  { key: "delivered", label: "Delivered", Icon: Home },
];

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "en_route", "delivered"];

function getStepState(stepKey: OrderStatus, currentStatus: OrderStatus) {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "upcoming";
}

interface Props {
  order: Order;
  onCancel: (id: string) => void;
}

export default function OrderTracker({ order, onCancel }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const needsPayment = order.status === "delivered" && order.paymentStatus !== "paid";

  return (
    <div className="bg-white rounded-3xl border border-[#D6D3D1] p-5 space-y-4">
      {/* Vendor + status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-[#0F6E56]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#134E4A] text-sm truncate">
            {order.item.vendorName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.item.quantity} × {order.item.productName} · KSh {order.totalAmount.toLocaleString()}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${
            order.status === "delivered"
              ? order.paymentStatus === "paid"
                ? "bg-[#E1F5EE] text-[#0F6E56]"
                : "bg-[#FFF7ED] text-[#854F0B]"
              : order.status === "en_route"
              ? "bg-[#E1F5EE] text-[#0F6E56]"
              : order.status === "confirmed"
              ? "bg-blue-50 text-blue-700"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {order.status === "delivered"
            ? order.paymentStatus === "paid"
              ? "Paid"
              : "Payment due"
            : order.status === "en_route"
            ? "On the way"
            : order.status === "confirmed"
            ? "Confirmed"
            : "Pending"}
        </span>
      </div>

      {/* Progress rail */}
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const state = getStepState(step.key, order.status);
          const StepIcon = step.Icon;
          return (
            <div key={step.key} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    state === "done"
                      ? "bg-[#134E4A] text-white"
                      : state === "active"
                      ? "bg-[#4FD1C5] text-white"
                      : "border-2 border-[#D6D3D1] bg-white text-gray-400"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <p
                  className={`text-[10px] mt-1.5 text-center leading-tight ${
                    state === "active"
                      ? "text-[#134E4A] font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mt-3.5 mx-1 rounded transition-colors ${
                    getStepState(STEPS[i + 1].key, order.status) !== "upcoming" ||
                    order.status === STEPS[i + 1].key
                      ? "bg-[#134E4A]"
                      : getStepState(step.key, order.status) === "done"
                      ? "bg-[#134E4A]"
                      : "bg-[#D6D3D1]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Driver card */}
      {order.driver && (
        <div className="flex items-center gap-3 bg-[#FAFAF8] rounded-2xl p-3">
          <div className="w-9 h-9 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-semibold shrink-0">
            {order.driver.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {order.driver.name}
            </p>
            <p className="text-xs text-gray-500">
              {order.status === "delivered" ? "Delivered by" : `Arrives in ~${order.driver.etaMinutes} min`} · {order.driver.vehicle}
            </p>
          </div>
          <a
            href={`tel:${order.driver.phone}`}
            className="w-8 h-8 rounded-full bg-[#134E4A] flex items-center justify-center shrink-0"
            aria-label={`Call ${order.driver.name}`}
          >
            <Phone className="w-4 h-4 text-[#4FD1C5]" />
          </a>
        </div>
      )}

      {/* Pay on delivery */}
      {needsPayment && (
        <div className="bg-[#FFF7ED] border border-[#F5DEB0] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#854F0B] shrink-0" />
            <p className="text-sm font-semibold text-[#854F0B]">Your order has arrived</p>
          </div>
          <p className="text-xs text-[#854F0B]/80">
            Pay KSh {order.totalAmount.toLocaleString()} by M-Pesa to complete this order.
          </p>
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-[#134E4A] text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition"
          >
            Pay now
          </button>
        </div>
      )}

      {/* Cancel — only while nothing has shipped yet */}
      {(order.status === "pending" || order.status === "confirmed") && (
        <button
          onClick={() => onCancel(order.id)}
          className="w-full text-sm text-red-500 border border-red-200 rounded-2xl py-2 hover:bg-red-50 transition"
        >
          Cancel Order
        </button>
      )}

      {showPayment && <PaymentPrompt order={order} onClose={() => setShowPayment(false)} />}
    </div>
  );
}
