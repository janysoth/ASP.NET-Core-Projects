import React, {
  useMemo,
  useState,
} from 'react';

import {
  ChevronDownIcon,
} from '@/components/icons/Icons';

import {
  FloatingPanel,
  useFloatingOverlay,
} from '@/components/overlays';

import DropdownList from './DropdownList';

/*===========================================================
  Dropdown

  => Shared application dropdown.

  Handles:
  => Open / close.
  => Floating positioning.
  => Selected value.
  => Width matching trigger.
  => Keyboard dismissal.
  => Outside click.

  IMPORTANT:
  => Does not know anything about months, years,
     accounts, or categories.
===========================================================*/
const Dropdown = ({
  value,

  items = [],

  onChange,

  placeholder = 'Select...',

  disabled = false,

  width = 'auto',

  className = '',
}) => {
  /*===========================================================
    Open State
  ===========================================================*/
  const [
    open,
    setOpen,
  ] = useState(false);

  /*===========================================================
    Floating Overlay
  ===========================================================*/
  const overlay =
    useFloatingOverlay({
      open,
      onOpenChange:
        setOpen,
      placement:
        'bottom-start',
      role: 'listbox',
    });

  /*===========================================================
    Selected Item
  ===========================================================*/
  const selectedItem =
    useMemo(
      () =>
        items.find(
          (item) =>
            item.value ===
            value
        ),
      [
        items,
        value,
      ]
    );

  /*===========================================================
    Trigger Width
  ===========================================================*/
  const panelWidth =
    width ===
      'trigger'
      ? overlay.refs
        .reference
        ?.current
        ?.offsetWidth
      : width;

  /*===========================================================
    Select Item
  ===========================================================*/
  const handleSelect = (
    selectedValue
  ) => {
    onChange?.(
      selectedValue
    );

    setOpen(false);
  };

  return (
    <>
      {/*=====================================================
        Trigger
      =====================================================*/}
      <button
        ref={
          overlay.refs
            .setReference
        }
        type="button"
        disabled={
          disabled
        }
        {...overlay.getReferenceProps()}
        className={`
          flex
          w-full
          items-center
          justify-between

          rounded-xl
          border

          bg-[var(--app-surface)]

          px-4
          py-3

          text-left
          text-sm
          font-medium

          transition-all
          duration-200

          ${disabled
            ? `
                  cursor-not-allowed
                  opacity-60
                `
            : `
                  hover:border-[var(--app-primary)]/50
                `
          }

          ${open
            ? `
                  border-[var(--app-primary)]

                  ring-2
                  ring-[var(--app-primary)]/20
                `
            : `
                  border-[var(--app-border)]
                `
          }

          ${className}
        `}
      >
        <span
          className={
            selectedItem
              ? 'text-[var(--app-text)]'
              : 'text-[var(--app-text-muted)]'
          }
        >
          {selectedItem
            ?.label ??
            placeholder}
        </span>

        <ChevronDownIcon
          className={`
            h-4
            w-4

            transition-transform
            duration-200

            text-[var(--app-text-muted)]

            ${open
              ? 'rotate-180'
              : ''
            }
          `}
        />
      </button>

      {/*=====================================================
        Floating Panel
      =====================================================*/}
      <FloatingPanel
        open={open}
        overlay={
          overlay
        }
        width={
          panelWidth
        }
        className="mt-2"
      >
        <DropdownList
          items={items}
          selectedValue={
            value
          }
          onSelect={
            handleSelect
          }
        />
      </FloatingPanel>
    </>
  );
};

export default Dropdown;