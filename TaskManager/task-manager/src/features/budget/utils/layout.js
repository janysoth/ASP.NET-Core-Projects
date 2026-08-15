/*===========================================================
  Shared Budget Financial Layout

  Layout rule:
  => First column is flexible and takes remaining width.
  => Every non-description column uses the same fixed width.
  => Financial columns align consistently across sections.
===========================================================*/

export const FINANCIAL_COLUMN_WIDTH =
  160;

/*===========================================================
  createFinancialColumns:
  => First column defaults to flexible.
  => Remaining columns default to fixed width.
  => First column aligns left.
  => Remaining columns align right.
===========================================================*/
export const createFinancialColumns = (
  columns = []
) => {
  return columns.map(
    (
      column,
      index
    ) => {
      const isFirst =
        index === 0;

      return {
        ...column,

        flexible:
          column.flexible ??
          isFirst,

        width:
          column.width ??
          (
            isFirst
              ? undefined
              : FINANCIAL_COLUMN_WIDTH
          ),

        align:
          column.align ??
          (
            isFirst
              ? 'left'
              : 'right'
          ),
      };
    }
  );
};

/*===========================================================
  getFinancialGridStyle:
  => Creates the CSS grid template.

  Example with 3 columns:

  minmax(0, 1fr) 160px 160px
===========================================================*/
export const getFinancialGridStyle = (
  columns = []
) => {
  if (
    !Array.isArray(columns) ||
    columns.length === 0
  ) {
    return {
      gridTemplateColumns:
        'minmax(0, 1fr)',
    };
  }

  const template =
    columns
      .map(
        (
          column,
          index
        ) => {
          const isFlexible =
            column.flexible ??
            index === 0;

          if (isFlexible) {
            return 'minmax(0, 1fr)';
          }

          const width =
            Number(
              column.width ??
              FINANCIAL_COLUMN_WIDTH
            );

          return `${width}px`;
        }
      )
      .join(' ');

  return {
    gridTemplateColumns:
      template,
  };
};

/*===========================================================
  getFinancialColumnAlignment
===========================================================*/
export const getFinancialColumnAlignment = (
  alignment = 'right'
) => {
  switch (alignment) {
    case 'left':
      return 'text-left';

    case 'center':
      return 'text-center';

    case 'right':
    default:
      return 'text-right';
  }
};

/*===========================================================
  LEGACY CONSTANTS:
  => Keep temporarily while remaining sections migrate.
===========================================================*/

export const DESCRIPTION_COLUMN =
  'clamp(260px, 34vw, 420px)';

export const MONEY_COLUMN_WIDTH =
  'w-32';

export const STATUS_COLUMN_WIDTH =
  'w-28';

export const DATE_COLUMN_WIDTH =
  'w-32';

export const ACTIONS_COLUMN_WIDTH =
  'w-40';

export const FINANCIAL_TABLE_GAP =
  'gap-8';