import {
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';

/*===========================================================
  useOverlay:
  => Shared Floating UI behavior for dropdowns, date pickers,
     menus, and other floating UI.

  Handles:
  => Open / close state.
  => Trigger clicks.
  => Outside click dismissal.
  => Escape key dismissal.
  => ARIA role wiring.
  => Floating element positioning.

  IMPORTANT:
  => Does not render UI.
  => Consumers provide the trigger and floating panel.
===========================================================*/
const useFloatingOverlay = ({
  open,
  onOpenChange,

  placement = 'bottom-start',

  role = 'dialog',
}) => {
  /*===========================================================
    Floating UI
  ===========================================================*/
  const {
    refs,
    floatingStyles,
    context,
  } = useFloating({
    open,
    onOpenChange,
    placement,
  });

  /*===========================================================
    Interactions
  ===========================================================*/
  const click =
    useClick(
      context
    );

  const dismiss =
    useDismiss(
      context
    );

  const roleInteraction =
    useRole(
      context,
      {
        role,
      }
    );

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

    getReferenceProps,
    getFloatingProps,
  };
};

export default useFloatingOverlay;