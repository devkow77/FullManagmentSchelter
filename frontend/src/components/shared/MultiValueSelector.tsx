import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  ComboboxChip,
} from "../ui/combobox";
import type { LabelValueType } from "@/types/common";

type SelectorProps = {
  items: LabelValueType[];
  placeholder: string;
  value: string[];
  onValueChange: (v: string[]) => void;
};

const MultiValueSelector = ({
  items,
  placeholder,
  value,
  onValueChange,
}: SelectorProps) => (
  <Combobox items={items} multiple value={value} onValueChange={onValueChange}>
    <ComboboxChips>
      <ComboboxValue>
        {value
          .map((val) => items.find((i) => i.value === val)?.label)
          .filter(Boolean)
          .map((label) => (
            <ComboboxChip key={label}>{label}</ComboboxChip>
          ))}
      </ComboboxValue>
      <ComboboxChipsInput placeholder={placeholder} />
    </ComboboxChips>
    <ComboboxContent>
      <ComboboxEmpty>Brak dostępnych opcji</ComboboxEmpty>
      <ComboboxList>
        {(item) => (
          <ComboboxItem key={item.value} value={item.value}>
            {item.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);

export default MultiValueSelector;
