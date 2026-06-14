import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxList,
  ComboboxItem,
} from "../ui/combobox";

type SelectorProps = {
  items: string[];
  placeholder: string;
  value: string | null;
  onValueChange: (v: string | null) => void;
};

const SingleValueSelector = ({
  items,
  placeholder,
  value,
  onValueChange,
}: SelectorProps) => (
  <Combobox
    items={items}
    value={value}
    onValueChange={(val) => onValueChange(val)}
  >
    <ComboboxChips>
      <ComboboxChipsInput
        placeholder={placeholder}
        className="placeholder:text-muted-foreground py-1 text-sm lg:text-base"
      />
    </ComboboxChips>
    <ComboboxContent>
      <ComboboxEmpty>Brak dostępnych opcji</ComboboxEmpty>
      <ComboboxList>
        {items.map((item) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        ))}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);

export default SingleValueSelector;
