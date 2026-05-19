import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { cn } from '../../../components/ui/utils';
import {
  ensureFontMetadataLoaded,
  getFontMetadata,
  getBareFontFamily,
  loadGoogleFont,
  toFontFamilyString,
} from '../../utils/googleFonts';
import type { FontFamilyMetadata } from '../../utils/googleFonts';

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [fonts, setFonts] = useState<FontFamilyMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    ensureFontMetadataLoaded().then((metadata) => {
      if (!isMounted) return;
      setFonts(metadata);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  const currentFamily = getBareFontFamily(value);
  const visibleFonts = useMemo(() => {
    if (!currentFamily) return fonts;
    const hasCurrent = fonts.some((font) => font.family.toLowerCase() === currentFamily.toLowerCase());
    return hasCurrent ? fonts : [getFontMetadata(currentFamily), ...fonts];
  }, [currentFamily, fonts]);
  const isUsingFallback = fonts.length > 0 && fonts.every((font) => font.source !== 'google');

  const handleSelect = (family: string) => {
    loadGoogleFont(family);
    onChange(toFontFamilyString(family));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between px-2 text-xs font-normal"
        >
          <span className={cn('truncate', !currentFamily && 'text-muted-foreground')}>
            {currentFamily || 'Select font family'}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Google Fonts..." className="h-9 text-xs" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading fonts...
              </div>
            ) : (
              <>
                <CommandEmpty>No fonts found.</CommandEmpty>
                <CommandGroup heading={isUsingFallback ? 'Fallback Fonts' : 'Google Fonts'}>
                  {visibleFonts.map((font) => (
                    <CommandItem
                      key={font.family}
                      value={font.family}
                      onSelect={() => handleSelect(font.family)}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          'size-3.5',
                          currentFamily.toLowerCase() === font.family.toLowerCase()
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <span style={{ fontFamily: toFontFamilyString(font.family) }}>
                        {font.family}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
