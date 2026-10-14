import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Caption1,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Switch,
  Text,
  Title2,
  Title3,
  Toast,
  ToastTitle,
  makeStyles,
  tokens,
  useToastController,
  type GriffelStyle,
} from '@fluentui/react-components';
import { ArrowSyncRegular, DeleteRegular, DragRegular, SaveRegular } from '@fluentui/react-icons';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveFormSetting } from '../api/formSettings';
import { CustomFieldInput } from '../components/CustomFieldInput';
import { TOASTER_ID, useErrorToast } from '../hooks/useErrorToast';
import type { FormField, FormFieldType, FormRow } from '../utils/types';
import { useFormSetting } from '../hooks/useFormSetting';

const TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'Text',
  date: 'Date',
  datetime: 'Date and Time',
  email: 'Email',
};

const PRESET_TYPES: FormFieldType[] = ['text', 'date', 'datetime', 'email'];

const PRESET_PREFIX = 'preset:';
const EMPTY_CANVAS_ID = 'empty-canvas';
const INSERT_PREFIX = 'insert:';
const EMPTY_CELL_PREFIX = 'empty-cell:';
const MAX_FIELDS_PER_ROW = 2;
const ROW_PADDING = 16;

const insertIndex = (id: string | number | undefined): number | undefined => {
  const value = String(id ?? '');
  return value.startsWith(INSERT_PREFIX) ? Number(value.slice(INSERT_PREFIX.length)) : undefined;
};

const emptyCellRowId = (id: string | number | undefined): string | undefined => {
  const value = String(id ?? '');
  return value.startsWith(EMPTY_CELL_PREFIX) ? value.slice(EMPTY_CELL_PREFIX.length) : undefined;
};

const activeSlotStyle: GriffelStyle = {
  border: `1px dashed ${tokens.colorCompoundBrandStroke}`,
  borderRadius: tokens.borderRadiusMedium,
  padding: '10px',
  textAlign: 'center',
  color: tokens.colorNeutralForeground3,
  backgroundColor: tokens.colorBrandBackground2,
};

type ActiveDrag =
  { kind: 'preset'; type: FormFieldType } | { kind: 'field'; field: FormField } | { kind: 'row'; row: FormRow } | null;

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '220px minmax(0, 1fr) 320px',
    gap: '16px',
    alignItems: 'start',
  },
  palette: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'sticky',
    top: '16px',
  },
  paletteHint: {
    color: tokens.colorNeutralForeground3,
  },
  preset: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '8px',
    cursor: 'grab',
    userSelect: 'none',
  },
  presetDragging: {
    opacity: 0.4,
  },
  canvas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    minHeight: '200px',
  },
  row: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: `${ROW_PADDING}px`,
  },
  rowDropTarget: {
    // border: `1px dashed ${tokens.colorCompoundBrandStroke}`,
    // backgroundColor: tokens.colorBrandBackground2,
  },
  rowForbidden: {
    border: `1px dashed ${tokens.colorPaletteRedBorder2}`,
    backgroundColor: tokens.colorPaletteRedBackground2,
  },
  rowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  handle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    borderRadius: tokens.borderRadiusSmall,
    background: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'grab',
    padding: 0,
  },
  rowFields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    position: 'relative',
  },
  emptyCell: {
    borderRadius: tokens.borderRadiusSmall,
    minHeight: '48px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  emptyCellActive: {
    border: `1px dashed ${tokens.colorCompoundBrandStroke}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  emptyCellReflow: {
    minWidth: '16px',
    maxWidth: '16px',
    justifySelf: 'end',
  },
  reflowPlaceholder: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 'calc(50% - 8px)',
    border: `1px dashed ${tokens.colorCompoundBrandStroke}`,
    borderRadius: tokens.borderRadiusSmall,
    minHeight: '80px',
    backgroundColor: tokens.colorBrandBackground2,
  },
  field: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
  },
  fieldSelected: {
    border: `1px solid ${tokens.colorStrokeFocus2}`,
    boxShadow: `0 0 0 1px ${tokens.colorStrokeFocus2} inset`,
  },
  fieldDragging: {
    opacity: 0.5,
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  grip: {
    color: tokens.colorNeutralForeground3,
    cursor: 'grab',
  },
  fieldLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fieldDeleteBtn: {
    display: 'block',
    visibility: 'hidden',
  },
  fieldDeleteBtnSelected: {
    marginLeft: 'auto',
    display: 'block',
  },
  fieldDeleteBtnIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  panel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'sticky',
    top: '16px',
  },
  slotWrapper: {
    padding: '8px 0',
  },
  slotWrapperLeading: {
    padding: '0',
  },
  slotWrapperActive: {
    padding: '16px 0',
  },
  slotWrapperLeadingActive: {
    padding: '0 0 16px 0',
  },
  slotInnerActive: {
    ...activeSlotStyle,
  },
  empty: {
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '32px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

function newId(): string {
  return crypto.randomUUID();
}

function newField(type: FormFieldType = 'text'): FormField {
  return {
    id: newId(),
    type,
    label: TYPE_LABELS[type],
    required: false,
    disabled: false,
    deletedAt: null,
  };
}

function withoutEmptyRows(rows: FormRow[]): FormRow[] {
  return rows.filter((row) => row.fields.length > 0);
}

function targetRowId(rows: FormRow[], overId: string | number | undefined): string | undefined {
  if (overId === undefined) {
    return undefined;
  }
  const id = String(overId);
  if (rows.some((row) => row.id === id)) {
    return id;
  }
  return rows.find((row) => row.fields.some((field) => field.id === id))?.id;
}

function PresetItem({ type }: { type: FormFieldType }) {
  const styles = useStyles();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${PRESET_PREFIX}${type}` });

  return (
    <div
      ref={setNodeRef}
      className={[styles.preset, isDragging ? styles.presetDragging : ''].join(' ')}
      {...attributes}
      {...listeners}
    >
      <DragRegular />
      <Caption1>{TYPE_LABELS[type]}</Caption1>
    </div>
  );
}

function EmptyCanvas({ dropTarget }: { dropTarget: boolean }) {
  const styles = useStyles();
  const { setNodeRef } = useDroppable({ id: EMPTY_CANVAS_ID });

  return (
    <div
      ref={setNodeRef}
      className={styles.empty}
      style={
        dropTarget
          ? {
              borderColor: tokens.colorCompoundBrandStroke,
              borderStyle: 'dashed',
              borderWidth: '2px',
              backgroundColor: tokens.colorBrandBackground2,
            }
          : undefined
      }
    >
      Drag a field from the left to build the form.
    </div>
  );
}

function InsertSlot({ index, dropTarget, leading }: { index: number; dropTarget: boolean; leading?: boolean }) {
  const styles = useStyles();
  const { setNodeRef } = useDroppable({ id: `${INSERT_PREFIX}${index}` });

  const wrapperClass = dropTarget
    ? leading
      ? styles.slotWrapperLeadingActive
      : styles.slotWrapperActive
    : leading
      ? styles.slotWrapperLeading
      : styles.slotWrapper;

  return (
    <div ref={setNodeRef} className={wrapperClass}>
      <div className={dropTarget ? styles.slotInnerActive : undefined}>
        {dropTarget ? 'Drop here to add a new row' : null}
      </div>
    </div>
  );
}

interface FieldCardProps {
  field: FormField;
  selected: boolean;
  dropTarget: boolean;
  reflowShift?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function FieldCard({ field, selected, dropTarget, reflowShift, onSelect, onDelete }: FieldCardProps) {
  const styles = useStyles();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: reflowShift ? 'translateX(calc(100% + 16px))' : CSS.Transform.toString(transform),
        transition: reflowShift ? 'transform 150ms ease' : transition,
      }}
      className={[
        styles.field,
        selected ? styles.fieldSelected : '',
        isDragging ? styles.fieldDragging : '',
        dropTarget ? styles.rowDropTarget : '',
      ].join(' ')}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      {...attributes}
      {...listeners}
    >
      <div className={styles.fieldHeader}>
        <DragRegular aria-hidden className={styles.grip} />
        <Caption1 className={styles.fieldLabel}>{field.label}</Caption1>
        <Button
          className={selected ? styles.fieldDeleteBtnSelected : styles.fieldDeleteBtn}
          appearance="subtle"
          size="small"
          icon={<DeleteRegular className={styles.fieldDeleteBtnIcon} />}
          aria-label={`Delete ${field.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        />
      </div>
      <CustomFieldInput field={field} value="" disabled onChange={() => {}} />
    </div>
  );
}

function DragPreview({ active }: { active: NonNullable<ActiveDrag> }) {
  const styles = useStyles();

  if (active.kind === 'row') {
    return (
      <div className={styles.row}>
        <div className={styles.rowFields}>
          {active.row.fields.map((field) => (
            <div key={field.id} className={styles.field}>
              <div className={styles.fieldHeader}>
                <Caption1 className={styles.fieldLabel}>{field.label}</Caption1>
              </div>
              <CustomFieldInput field={field} value="" disabled onChange={() => {}} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const field = active.kind === 'preset' ? newField(active.type) : active.field;
  return (
    <div className={styles.field} style={{ minWidth: 240 }}>
      <div className={styles.fieldHeader}>
        <DragRegular aria-hidden className={styles.grip} />
        <Caption1 className={styles.fieldLabel}>{field.label}</Caption1>
      </div>
      <CustomFieldInput field={field} value="" disabled onChange={() => {}} />
    </div>
  );
}

function EmptyCell({ rowId, dropTarget, collapsed }: { rowId: string; dropTarget: boolean; collapsed?: boolean }) {
  const styles = useStyles();
  const { setNodeRef } = useDroppable({ id: `${EMPTY_CELL_PREFIX}${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.emptyCell,
        dropTarget ? styles.emptyCellActive : '',
        collapsed ? styles.emptyCellReflow : '',
      ].join(' ')}
    />
  );
}

interface RowCardProps {
  row: FormRow;
  selectedFieldId?: string;
  dropTarget: boolean;
  dropFieldId?: string;
  dropEmptyRowId?: string;
  dropForbiddenId?: string;
  presetDragging: boolean;
  onSelectField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onDeleteRow: () => void;
}

function RowCard({
  row,
  selectedFieldId,
  dropTarget,
  dropFieldId,
  dropEmptyRowId,
  dropForbiddenId,
  presetDragging,
  onSelectField,
  onDeleteField,
}: RowCardProps) {
  const styles = useStyles();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const reflowFieldId =
    presetDragging && dropFieldId !== undefined && row.fields.some((f) => f.id === dropFieldId)
      ? dropFieldId
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        styles.row,
        dropTarget ? styles.rowDropTarget : '',
        dropForbiddenId === row.id ? styles.rowForbidden : '',
        isDragging ? styles.fieldDragging : '',
      ].join(' ')}
    >
      <div className={styles.rowHeader}>
        <button
          ref={setActivatorNodeRef}
          className={styles.handle}
          aria-label="Reorder row"
          {...attributes}
          {...listeners}
        >
          <DragRegular />
        </button>
      </div>
      <SortableContext items={row.fields.map((field) => field.id)} strategy={horizontalListSortingStrategy}>
        <div className={styles.rowFields}>
          {reflowFieldId !== undefined ? <div className={styles.reflowPlaceholder} /> : null}
          {row.fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              selected={field.id === selectedFieldId}
              dropTarget={field.id === dropFieldId}
              reflowShift={reflowFieldId === field.id}
              onSelect={() => onSelectField(field.id)}
              onDelete={() => onDeleteField(field.id)}
            />
          ))}
          {row.fields.length < MAX_FIELDS_PER_ROW ? (
            <EmptyCell rowId={row.id} dropTarget={dropEmptyRowId === row.id} collapsed={reflowFieldId !== undefined} />
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

export function FormSettingsPage() {
  const styles = useStyles();
  const showError = useErrorToast();
  const { dispatchToast } = useToastController(TOASTER_ID);
  const { rows: setting, isLoading, formSettingError, retryFormSetting } = useFormSetting();

  const [rows, setRows] = useState<FormRow[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>();
  const [dropRowId, setDropRowId] = useState<string>();
  const [dropFieldId, setDropFieldId] = useState<string>();
  const [dropEmptyRowId, setDropEmptyRowId] = useState<string>();
  const [dropForbiddenId, setDropForbiddenId] = useState<string>();
  const [overEmpty, setOverEmpty] = useState(false);
  const [overSlot, setOverSlot] = useState<number>();
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (setting) {
      setRows(setting);
      setSelectedFieldId(undefined);
    }
  }, [setting]);

  const selectedField = useMemo(
    () => rows.flatMap((row) => row.fields).find((field) => field.id === selectedFieldId),
    [rows, selectedFieldId],
  );

  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const hits = pointerWithin(args);
      const first = rows[0]?.id;
      const pointer = args.pointerCoordinates;
      if (first && pointer) {
        const rect = args.droppableRects.get(first);
        if (rect && pointer.y >= rect.top && pointer.y <= rect.top + ROW_PADDING) {
          return [{ id: `${INSERT_PREFIX}0` }, ...hits];
        }
      }
      return hits;
    },
    [rows],
  );

  const dirty = useMemo(() => JSON.stringify(rows) !== JSON.stringify(setting ?? []), [rows, setting]);

  const patchField = (fieldId: string, patch: Partial<FormField>) => {
    setRows(
      rows.map((row) => ({
        ...row,
        fields: row.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
      })),
    );
  };

  const deleteField = (fieldId: string) => {
    const currentRow = rows.find((row) => row.fields.some((field) => field.id === fieldId));
    const newRowFields = currentRow?.fields.filter((field) => fieldId !== field.id);
    let newRows: FormRow[];
    if (!newRowFields?.length) {
      newRows = rows.filter((row) => row.id !== currentRow?.id);
    } else {
      newRows = rows.map((row) => (row.id === currentRow?.id ? { ...row, fields: newRowFields } : row));
    }
    setRows(newRows);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(undefined);
    }
  };

  const deleteRow = (rowId: string) => {
    const row = rows.find((item) => item.id === rowId);
    setRows(rows.filter((item) => item.id !== rowId));
    if (row && selectedFieldId && row.fields.some((field) => field.id === selectedFieldId)) {
      setSelectedFieldId(undefined);
    }
  };

  const addFieldToRow = (rowId: string, type: FormFieldType, beforeFieldId?: string) => {
    const target = rows.find((row) => row.id === rowId);
    if (!target || target.fields.length >= MAX_FIELDS_PER_ROW) {
      return;
    }

    const field = newField(type);
    const fields = [...target.fields];
    const index = beforeFieldId ? fields.findIndex((item) => item.id === beforeFieldId) : -1;
    fields.splice(index < 0 ? fields.length : index, 0, field);
    setRows(rows.map((row) => (row.id === rowId ? { ...row, fields } : row)));
    setSelectedFieldId(field.id);
  };

  const insertFieldAsNewRow = (field: FormField, index: number) => {
    const next = [...rows];
    next.splice(index, 0, { id: newId(), fields: [field] });
    setRows(next);
    setSelectedFieldId(field.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDropRowId(undefined);
    setDropFieldId(undefined);
    setDropEmptyRowId(undefined);
    setDropForbiddenId(undefined);
    setOverEmpty(false);
    setOverSlot(undefined);

    const id = String(event.active.id);
    if (id.startsWith(PRESET_PREFIX)) {
      setActiveDrag({ kind: 'preset', type: id.slice(PRESET_PREFIX.length) as FormFieldType });
      return;
    }
    const row = rows.find((item) => item.id === id);
    if (row) {
      setActiveDrag({ kind: 'row', row });
      return;
    }
    const field = rows.flatMap((item) => item.fields).find((item) => item.id === id);
    setActiveDrag(field ? { kind: 'field', field } : null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id === undefined ? undefined : String(event.over.id);

    if (rows.some((row) => row.id === activeId)) {
      setOverSlot(undefined);
      return;
    }

    const slot = insertIndex(overId);
    setOverSlot(slot);
    const emptyRowId = emptyCellRowId(overId);
    setDropEmptyRowId(emptyRowId);
    if (!activeId.startsWith(PRESET_PREFIX)) {
      setDropFieldId(
        overId !== undefined && rows.flatMap((row) => row.fields).some((field) => field.id === overId)
          ? overId
          : undefined,
      );
      setDropForbiddenId(undefined);
      return;
    }

    const overRowId = targetRowId(rows, overId);
    const overRow = rows.find((row) => row.id === overRowId);
    const isFullRow = overRow !== undefined && overRow.fields.length >= MAX_FIELDS_PER_ROW;
    const overFieldId =
      overId !== undefined && rows.flatMap((row) => row.fields).some((field) => field.id === overId)
        ? overId
        : undefined;

    const lockedFieldId = isFullRow ? undefined : overFieldId;

    setDropFieldId(lockedFieldId);
    setDropForbiddenId(overRowId !== undefined && isFullRow ? overRowId : undefined);
    setDropRowId(
      overId === EMPTY_CANVAS_ID ||
        slot !== undefined ||
        emptyRowId !== undefined ||
        lockedFieldId !== undefined ||
        isFullRow
        ? undefined
        : overRowId,
    );
    setOverEmpty(overId === EMPTY_CANVAS_ID);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDropRowId(undefined);
    setDropFieldId(undefined);
    setDropEmptyRowId(undefined);
    setDropForbiddenId(undefined);
    setOverEmpty(false);
    setOverSlot(undefined);
    setActiveDrag(null);
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const emptyTargetRowId = emptyCellRowId(overId);

    if (activeId.startsWith(PRESET_PREFIX)) {
      const type = activeId.slice(PRESET_PREFIX.length) as FormFieldType;
      if (emptyTargetRowId) {
        addFieldToRow(emptyTargetRowId, type);
        return;
      }
      const slot = insertIndex(overId);
      if (slot !== undefined) {
        insertFieldAsNewRow(newField(type), slot);
        return;
      }
      if (overId === EMPTY_CANVAS_ID) {
        insertFieldAsNewRow(newField(type), rows.length);
        return;
      }
      const rowId = targetRowId(rows, overId);
      if (rowId) {
        addFieldToRow(
          rowId,
          type,
          rows.some((row) => row.fields.some((field) => field.id === overId)) ? overId : undefined,
        );
      }
      return;
    }

    if (emptyTargetRowId) {
      const source = rows.find((row) => row.fields.some((field) => field.id === activeId));
      const moved = source?.fields.find((field) => field.id === activeId);
      if (!source || !moved || source.id === emptyTargetRowId) {
        return;
      }
      setRows(
        withoutEmptyRows(
          rows.map((row) => {
            if (row.id === source.id) {
              return { ...row, fields: row.fields.filter((field) => field.id !== activeId) };
            }
            if (row.id === emptyTargetRowId) {
              return { ...row, fields: [...row.fields, moved] };
            }
            return row;
          }),
        ),
      );
      return;
    }

    const slot = insertIndex(over.id);
    if (slot !== undefined) {
      const moved = rows.flatMap((row) => row.fields).find((field) => field.id === activeId);
      if (!moved) {
        return;
      }
      const sourceIndex = rows.findIndex((row) => row.fields.some((field) => field.id === activeId));
      const stripped = withoutEmptyRows(
        rows.map((row) => ({
          ...row,
          fields: row.fields.filter((field) => field.id !== activeId),
        })),
      );
      stripped.splice(Math.min(sourceIndex < slot ? slot - 1 : slot, stripped.length), 0, {
        id: newId(),
        fields: [moved],
      });
      setRows(stripped);
      return;
    }

    const source = rows.find((row) => row.fields.some((field) => field.id === activeId));
    const target = rows.find((row) => row.fields.some((field) => field.id === over.id));

    if (source && target) {
      const moved = source.fields.find((field) => field.id === activeId);
      if (!moved) {
        return;
      }

      if (source.id === target.id) {
        const from = source.fields.findIndex((field) => field.id === activeId);
        const to = target.fields.findIndex((field) => field.id === over.id);
        setRows(rows.map((row) => (row.id === source.id ? { ...row, fields: arrayMove(row.fields, from, to) } : row)));
        return;
      }

      const from = source.fields.findIndex((field) => field.id === activeId);
      const to = target.fields.findIndex((field) => field.id === over.id);
      setRows(
        rows.map((row) => {
          if (row.id === source.id) {
            const fields = [...row.fields];
            fields[from] = target.fields[to];
            return { ...row, fields };
          }
          if (row.id === target.id) {
            const fields = [...row.fields];
            fields[to] = source.fields[from];
            return { ...row, fields };
          }
          return row;
        }),
      );
      return;
    }

    const from = rows.findIndex((row) => row.id === activeId);
    const to = rows.findIndex((row) => row.id === over.id);
    if (from >= 0 && to >= 0) {
      setRows(arrayMove(rows, from, to));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveFormSetting(withoutEmptyRows(rows));
      await retryFormSetting();
      dispatchToast(
        <Toast>
          <ToastTitle>Saved</ToastTitle>
        </Toast>,
        { intent: 'success', timeout: 3000 },
      );
    } catch (err) {
      showError('Save form settings failed', err, 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (formSettingError) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>Form settings couldn&apos;t be loaded</MessageBarTitle>
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button appearance="transparent" icon={<ArrowSyncRegular />} onClick={() => retryFormSetting()}>
              Retry
            </Button>
          }
        />
      </MessageBar>
    );
  }

  if (isLoading) {
    return <Text>Loading form settings…</Text>;
  }

  return (
    <div  onClick={() => setSelectedFieldId(undefined)}>
      <div className={styles.toolbar}>
        <Title2>Form settings</Title2>
        <Button appearance="primary" icon={<SaveRegular />} disabled={!dirty || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDropRowId(undefined);
          setDropFieldId(undefined);
          setDropEmptyRowId(undefined);
          setDropForbiddenId(undefined);
          setOverEmpty(false);
          setOverSlot(undefined);
          setActiveDrag(null);
        }}
      >
        <div className={styles.layout}>
          <div className={styles.palette}>
            <Title3>Fields</Title3>
            <Caption1 className={styles.paletteHint}>Drag a field onto the form.</Caption1>
            {PRESET_TYPES.map((type) => (
              <PresetItem key={type} type={type} />
            ))}
          </div>

          <div className={styles.canvas}>
            {rows.length === 0 ? (
              <EmptyCanvas dropTarget={overEmpty} />
            ) : (
              <>
                <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                  <InsertSlot index={0} dropTarget={overSlot === 0} leading />
                  {rows.map((row, index) => (
                    <Fragment key={row.id}>
                      <RowCard
                        row={row}
                        selectedFieldId={selectedFieldId}
                        dropTarget={dropRowId === row.id && row.fields.length < 2}
                        dropFieldId={dropFieldId}
                        dropEmptyRowId={dropEmptyRowId}
                        dropForbiddenId={dropForbiddenId}
                        presetDragging={activeDrag?.kind === 'preset'}
                        onSelectField={setSelectedFieldId}
                        onDeleteField={deleteField}
                        onDeleteRow={() => deleteRow(row.id)}
                      />
                      <InsertSlot index={index + 1} dropTarget={overSlot === index + 1} />
                    </Fragment>
                  ))}
                </SortableContext>
              </>
            )}
          </div>

          <div className={styles.panel}>
            {selectedField ? (
              <>
                <Title3>{TYPE_LABELS[selectedField.type]}</Title3>
                <Field label="Label" required>
                  <Input
                    value={selectedField.label}
                    onChange={(_, data) => patchField(selectedField.id, { label: data.value })}
                  />
                </Field>
                <Field label="Type">
                  <Dropdown
                    value={TYPE_LABELS[selectedField.type]}
                    selectedOptions={[selectedField.type]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        patchField(selectedField.id, { type: data.optionValue as FormFieldType });
                      }
                    }}
                  >
                    {PRESET_TYPES.map((type) => (
                      <Option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Key" hint="Fixed once created, used as the key on task data.">
                  <Input value={selectedField.id} readOnly disabled />
                </Field>
                <Switch
                  label="Required"
                  checked={selectedField.required}
                  onChange={(_, data) => patchField(selectedField.id, { required: data.checked })}
                />
                <Switch
                  label="Disabled"
                  checked={selectedField.disabled}
                  onChange={(_, data) => patchField(selectedField.id, { disabled: data.checked })}
                />
              </>
            ) : (
              <Text>Select a field to edit its properties.</Text>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>{activeDrag ? <DragPreview active={activeDrag} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
