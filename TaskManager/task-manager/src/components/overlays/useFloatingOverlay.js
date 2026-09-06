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

  Supports:
  => Normal field-relative positioning.
  => Modal-centered positioning.
  => Automatic repositioning.
  => Viewport collision handling.
  => Outside-click dismissal.
  => Escape dismissal.
===========================================================*/
const useFloatingOverlay = ({
  open,
  onOpenChange,

  placement = 'bottom-start',

  role = 'dialog',

  enableClick = true,

  centerInModal = false,

  offsetSize = 4,
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

    whileElementsMounted:
      autoUpdate,

    middleware: [
      /*=======================================================
        Offset / Modal Centering
      =======================================================*/
      offset(
        ({
          elements,
          rects,
        }) => {
          /*===================================================
            Normal Field Positioning
          ===================================================*/
          if (
            !centerInModal
          ) {
            return {
              mainAxis:
                offsetSize,

              crossAxis:
                0,
            };
          }

          /*===================================================
            Find Nearest Modal
            => AppModal renders as role="dialog".
          ===================================================*/
          const referenceElement =
            elements.reference;

          const modalElement =
            referenceElement instanceof Element
              ? referenceElement.closest(
                '[role="dialog"]'
              )
              : null;

          /*
            Fall back to normal positioning when DateInput is
            not inside a modal.
          */
          if (
            !modalElement
          ) {
            return {
              mainAxis:
                offsetSize,

              crossAxis:
                0,
            };
          }

          /*===================================================
            Calculate Modal Center
          ===================================================*/
          const modalRect =
            modalElement
              .getBoundingClientRect();

          const modalCenter =
            modalRect.left +
            modalRect.width / 2;

          const referenceCenter =
            rects.reference.x +
            rects.reference.width / 2;

          return {
            /*
              Keep the calendar close to the DateInput.
            */
            mainAxis:
              offsetSize,

            /*
              Shift horizontally so popup center aligns with
              the modal center.
            */
            crossAxis:
              modalCenter -
              referenceCenter,
          };
        }
      ),

      /*=======================================================
        Flip:
        => Moves above input when there is insufficient room
           below.
      =======================================================*/
      flip(),

      /*=======================================================
        Shift:
        => Keeps popup inside viewport.
      =======================================================*/
      shift({
        padding: 12,
      }),
    ],
  });

  /*===========================================================
    Click Interaction
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
    Dismiss Interaction
  ===========================================================*/
  const dismiss =
    useDismiss(
      context
    );

  /*===========================================================
    ARIA Role
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