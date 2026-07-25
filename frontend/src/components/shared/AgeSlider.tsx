import { Slider } from "@/components/ui";

const AgeSlider = ({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) => (
  <div className="col-span-2 w-64">
    <label className="mb-2 block text-sm">
      Wiek (lata): {value[0]} - {value[1]}
    </label>
    <Slider value={value} min={0} max={20} step={1} onValueChange={onChange} />
  </div>
);

export default AgeSlider;
