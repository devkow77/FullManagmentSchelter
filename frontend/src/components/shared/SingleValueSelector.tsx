import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui";
import type { LabelValueType } from "@/types/common";

type SelectorProps = {
  items: string[] | LabelValueType[];
  placeholder: string;
  value: string | null;
  onValueChange: (v: string | null) => void;
  className?: string;
};

const toOptions = (items: string[] | LabelValueType[]): LabelValueType[] =>
  items.map((item) =>
    typeof item === "string" ? { label: item, value: item } : item,
  );

const SingleValueSelector = ({
  items,
  placeholder,
  value,
  onValueChange,
  className,
}: SelectorProps) => {
  const options = toOptions(items);

  return (
    <Combobox
      items={options}
      value={value}
      onValueChange={(val) => onValueChange(val)}
    >
      <ComboboxChips className={className}>
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
};

export default SingleValueSelector;
