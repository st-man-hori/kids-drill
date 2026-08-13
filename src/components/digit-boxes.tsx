export const DigitBoxes = ({
  length,
  value,
  ariaHidden = true,
}: {
  length: number;
  value: string;
  ariaHidden?: boolean;
}) => {
  return (
    <div className="flex gap-2 justify-center" aria-hidden={ariaHidden}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="flex h-12 w-9 items-center justify-center rounded-sm bg-black/5 text-2xl font-bold text-foreground"
        >
          {value[i] ?? ""}
        </div>
      ))}
    </div>
  );
};
