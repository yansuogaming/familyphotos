import { Check } from "@/components/ui/icons";

/** Today's goal as a row of notebook squares, ticked in red pen. */
export function DailyTicks({ goal, done, size = "md" }: { goal: number; done: number; size?: "md" | "lg" }) {
  const cell = size === "lg" ? "size-[26px] sm:size-9" : "size-7";
  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label={`Đã làm ${done} trên ${goal} câu hôm nay`}>
      {Array.from({ length: goal }, (_, i) => (
        <span key={i} className={`${cell} flex items-center justify-center border border-rule bg-paper`}>
          {i < done && <Check size={size === "lg" ? 22 : 18} weight="bold" className="text-coral-ink" />}
        </span>
      ))}
    </div>
  );
}
