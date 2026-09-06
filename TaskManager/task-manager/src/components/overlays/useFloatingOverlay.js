import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';

/*===========================================================
  useFloatingOverlay:
  => Shared Floating UI behavior.

  Handles:
  => Floating positioning.
  => Viewport collision detection.
  => Automatic repositioning.
  => Optional trigger-click behavior.
  => Outside-click dismissal.
  => Escape-key dismissal.
  => ARIA role wiring.

  IMPORTANT:
  => enableClick should be false when the consuming component
     already controls opening itself.

  Example:
  => DateInput uses its calendar-icon button to open, so it
     does NOT need Floating UI's useClick interaction.
===========================================================*/
const useFloatingOverlay = ({
  open,
  onOpenChange,

  placement = 'bottom-start',

  role = 'dialog',

  enableClick = true,
}) => {
  /*===========================================================
    Floating UI
  ===========================================================*/
  const {
    refs,
    floatingStyles,
    context,
    isPositioned,
  } = useFloating({
    open,
    onOpenChange,
    placement,

    /*
      Keeps the floating element correctly positioned when:
      => Window resizes.
      => Page scrolls.
      => Reference element moves.
      => Floating element size changes.
    */
    whileElementsMounted:
      autoUpdate,

    middleware: [
      /*
        Small visual gap between the input and popup.
      */
      offset(2),

      /*
        Flip above the input if there is not enough room below.
      */
      flip(),

      /*
        Keep the panel inside the viewport.
      */
      shift({
        padding: 12,
      }),
    ],
  });

  /*===========================================================
    Trigger Click:
    => Optional.

    Dropdown:
    => Usually true.

    DateInput:
    => false because DateInputField already has its own
       calendar trigger button.
  ===========================================================*/
  const click =
    useClick(
      context,
      {
        enabled:
          enableClick,
      }
    );

  /*===========================================================
    Dismiss
  ===========================================================*/
  const dismiss =
    useDismiss(
      context
    );

  /*===========================================================
    Role
  ===========================================================*/
  const roleInteraction =
    useRole(
      context,
      {
        role,
      }
    );

  /*===========================================================
    Interactions
  ===========================================================*/
  const {
    getReferenceProps,
    getFloatingProps,
  } = useInteractions([
    click,
    dismiss,
    roleInteraction,
  ]);

  return {
    refs,
    floatingStyles,
    context,
    isPositioned,

    getReferenceProps,
    getFloatingProps,
  };
};

export default useFloatingOverlay;