"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
 DndContext,
 DragOverlay,
 closestCenter,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
 DragStartEvent,
 DragOverEvent,
 DragEndEvent,
 Active,
 Over,
} from "@dnd-kit/core";
import {
 arrayMove,
 SortableContext,
 sortableKeyboardCoordinates,
 verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface View {
 id: string;
 columnId: string;
 groupId: string;
 operator: string;
 value: string;
 columnType: string;
 enabled: boolean;
}

interface Group {
 groupId: string;
 groupIdx: number;
 title?: string;
 views: View[];
 enabled: boolean;
 isFakeGroup: boolean;
}

interface DragData {
 type: string;
 view?: View;
 group?: Group;
}

interface ActiveItem {
 type: string;
 item: View | Group;
}

const DRAG_TYPES = {
 VIEW: "view",
 GROUP: "group",
 NEW_GROUP_ZONE: "new-group-zone",
} as const;

const generateId = (): string => {
 return Math.random().toString(36).substr(2, 9);
};

const createFakeGroup = (groupIdx: number): Group => ({
 groupId: generateId(),
 groupIdx,
 views: [],
 isFakeGroup: true,
 enabled: true,
});

const getMockData = (): Group[] => [
 createFakeGroup(0),
 {
  groupId: "l6n7r8r9rusb8",
  groupIdx: 1,
  title: "AND CONDITIONS",
  views: [
   {
    columnId: "Target_OTO",
    id: "Target_OTO",
    operator: "is",
    value: "Vietnamese",
    columnType: "Vietnamese",
    groupId: "l6n7r8r9rusb8",
    enabled: true,
   },
   {
    columnId: "Buyers_and_by",
    groupId: "l6n7r8r9rusb8",
    id: "uf449j912yzq5",
    operator: "contains",
    value: "test",
    columnType: "English (United States)",
    enabled: true,
   },
  ],
  enabled: true,
  isFakeGroup: false,
 },
 createFakeGroup(2),
 {
  groupId: "y3iiruqz6vj6z",
  groupIdx: 3,
  title: "AND CONDITIONS",
  views: [
   {
    columnId: "Other_Column",
    groupId: "y3iiruqz6vj6z",
    id: "6ippfy765nq5p",
    operator: "is not",
    value: "example",
    columnType: "Other",
    enabled: true,
   },
   {
    columnId: "This_is_a_test",
    groupId: "y3iiruqz6vj6z",
    id: "this_is_a_test",
    operator: "is not",
    value: "example",
    columnType: "Other",
    enabled: true,
   },
  ],
  enabled: true,
  isFakeGroup: false,
 },
 createFakeGroup(4),
];

function rebuildGroupsWithFake(groups: Group[]): Group[] {
 const realGroups = groups.filter((g) => !g.isFakeGroup);

 const newGroups: Group[] = [];

 newGroups.push(createFakeGroup(0));

 realGroups.forEach((group, index) => {
  newGroups.push({ ...group, isFakeGroup: false });
  newGroups.push(createFakeGroup((index + 1) * 2));
 });

 return newGroups.map((group, index) => ({ ...group, groupIdx: index }));
}

interface SortableViewProps {
 view: View;
 groupEnabled?: boolean;
}

const SortableView = React.memo<SortableViewProps>(
 ({ view, groupEnabled = true }) => {
  const {
   attributes,
   listeners,
   setNodeRef,
   transform,
   transition,
   isDragging,
  } = useSortable({
   id: view.id,
   data: { type: DRAG_TYPES.VIEW, view } satisfies DragData,
  });

  const style = useMemo(
   () => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
   }),
   [transform, transition, isDragging]
  );

  const isDisabled = !groupEnabled || !view.enabled;

  return (
   <div
    ref={setNodeRef}
    style={style}
    className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 ${
     isDisabled ? "opacity-50" : ""
    }`}
   >
    <div className="flex items-center justify-between mb-3">
     <p className="text-red-500 rounded-sm flex-shrink-0">{view.columnId}</p>
     <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
     >
      <GripVertical size={14} />
     </div>
    </div>
   </div>
  );
 }
);

SortableView.displayName = "SortableView";

interface SortableGroupProps {
 group: Group;
 children: React.ReactNode;
 isDropTarget?: boolean;
}

const SortableGroup = React.memo<SortableGroupProps>(
 ({ group, children, isDropTarget = false }) => {
  const {
   attributes,
   listeners,
   setNodeRef,
   transform,
   transition,
   isDragging,
   isOver,
  } = useSortable({
   id: group.groupId,
   data: { type: DRAG_TYPES.GROUP, group } satisfies DragData,
  });

  const style = useMemo(
   () => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
   }),
   [transform, transition, isDragging]
  );

  // Render fake groups as drop zones
  if (group.isFakeGroup) {
   return (
    <div
     ref={setNodeRef}
     className={`transition-all duration-200 ${
      isOver
       ? "h-16 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg mb-4 flex items-center justify-center"
       : "h-2 mb-2"
     }`}
    >
     {isOver && (
      <div className="text-blue-600 font-medium text-sm">
       Drop here to create new group
      </div>
     )}
    </div>
   );
  }

  const borderClasses = useMemo(() => {
   if (isDropTarget) return "border-green-400 bg-green-50";
   if (isOver) return "border-blue-300 bg-blue-50";
   return "border-gray-200";
  }, [isDropTarget, isOver]);

  return (
   <div
    ref={setNodeRef}
    style={style}
    className={`border-2 rounded-lg p-4 mb-4 bg-gray-50 relative ${borderClasses} ${
     !group.enabled ? "opacity-60" : ""
    }`}
   >
    {/* Drop indicator for group merging */}
    {isDropTarget && (
     <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg bg-green-50 bg-opacity-50 flex items-center justify-center z-10">
      <div className="text-green-600 font-medium text-sm bg-white px-3 py-1 rounded-md shadow">
       Merge groups here
      </div>
     </div>
    )}

    <div className="flex items-center justify-between mb-4">
     <div className="flex items-center gap-4">
      <h3 className="font-semibold text-purple-600 text-sm">
       {group.title} ({group.views.length} items)
      </h3>
     </div>
     <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 ml-2"
     >
      <GripVertical size={16} />
     </div>
    </div>

    <SortableContext
     items={group.views.map((v) => v.id)}
     strategy={verticalListSortingStrategy}
    >
     {children}
    </SortableContext>
   </div>
  );
 }
);

SortableGroup.displayName = "SortableGroup";

const App: React.FC = () => {
 const [groups, setGroups] = useState<Group[]>(getMockData);
 const [activeId, setActiveId] = useState<string | null>(null);
 const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

 const activeIdRef = useRef<string | null>(null);
 const dragStartTime = useRef<number | null>(null);

 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: { distance: 8 },
  }),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  })
 );

 const { groupIds, viewIds, allItems } = useMemo(() => {
  const gIds = groups.map((g) => g.groupId);
  const vIds = groups.flatMap((g) => g.views.map((v) => v.id));
  return {
   groupIds: gIds,
   viewIds: vIds,
   allItems: [...gIds, ...vIds],
  };
 }, [groups]);

 const lookupMaps = useMemo(() => {
  const groupMap = new Map<string, Group>();
  const viewMap = new Map<string, View>();
  const viewToGroupMap = new Map<string, string>();

  groups.forEach((group) => {
   groupMap.set(group.groupId, group);
   group.views.forEach((view) => {
    viewMap.set(view.id, view);
    viewToGroupMap.set(view.id, group.groupId);
   });
  });

  return { groupMap, viewMap, viewToGroupMap };
 }, [groups]);

 const findContainer = useCallback(
  (id: string): string | null => {
   if (groupIds.includes(id)) return id;
   return lookupMaps.viewToGroupMap.get(id) || null;
  },
  [groupIds, lookupMaps.viewToGroupMap]
 );

 const findViewById = useCallback(
  (viewId: string): View | null => {
   return lookupMaps.viewMap.get(viewId) || null;
  },
  [lookupMaps.viewMap]
 );

 const findGroup = useCallback(
  (groupId: string): Group | null => {
   return lookupMaps.groupMap.get(groupId) || null;
  },
  [lookupMaps.groupMap]
 );

 const createNewGroupWithView = useCallback(
  (activeView: View, dropZoneIndex: number): void => {
   try {
    setGroups((prev) => {
     const newGroupId = generateId();
     let newGroups = [...prev];

     // Remove view from current group
     const activeGroupIndex = newGroups.findIndex((group) =>
      group.views.some((view) => view.id === activeView.id)
     );

     if (activeGroupIndex !== -1) {
      newGroups[activeGroupIndex] = {
       ...newGroups[activeGroupIndex],
       views: newGroups[activeGroupIndex].views.filter(
        (view) => view.id !== activeView.id
       ),
      };
     }

     // Create new group
     const newGroup: Group = {
      groupId: newGroupId,
      groupIdx: dropZoneIndex,
      title: "AND CONDITIONS",
      enabled: true,
      views: [{ ...activeView, groupId: newGroupId }],
      isFakeGroup: false,
     };

     // Replace the fake group
     const targetFakeGroupIndex = newGroups.findIndex(
      (g) => g.isFakeGroup && g.groupIdx === dropZoneIndex
     );

     if (targetFakeGroupIndex !== -1) {
      newGroups.splice(targetFakeGroupIndex, 1, newGroup);
     } else {
      newGroups.push(newGroup);
     }

     return rebuildGroupsWithFake(
      newGroups.filter((group) => group.views.length > 0 || group.isFakeGroup)
     );
    });
   } catch (error) {
    console.error("Error creating new group:", error);
   }
  },
  []
 );

 const mergeGroups = useCallback(
  (sourceGroupId: string, targetGroupId: string): void => {
   try {
    setGroups((prev) => {
     // Clone the groups
     const newGroups = [...prev];
     const sourceIndex = newGroups.findIndex(
      (g) => g.groupId === sourceGroupId
     );
     const targetIndex = newGroups.findIndex(
      (g) => g.groupId === targetGroupId
     );

     if (sourceIndex === -1 || targetIndex === -1) return prev;

     const sourceGroup = newGroups[sourceIndex];
     const targetGroup = newGroups[targetIndex];

     if (sourceGroup.isFakeGroup || targetGroup.isFakeGroup) return prev;

     const updatedViews = sourceGroup.views.map((view) => ({
      ...view,
      groupId: targetGroupId,
     }));

     newGroups[targetIndex] = {
      ...targetGroup,
      views: [...targetGroup.views, ...updatedViews],
     };

     newGroups.splice(sourceIndex, 1);

     return rebuildGroupsWithFake(
      newGroups.filter((group) => group.views.length > 0)
     );
    });
   } catch (error) {
    console.error("Error merging groups:", error);
   }
  },
  []
 );

 const handleDragStart = useCallback((event: DragStartEvent): void => {
  try {
   const { active } = event;
   setActiveId(active.id as string);
   activeIdRef.current = active.id as string;
   dragStartTime.current = Date.now();
   setDragOverGroup(null);
  } catch (error) {
   console.error("Error in drag start:", error);
  }
 }, []);

 const handleDragEnd = useCallback(
  (event: DragEndEvent): void => {
   try {
    const { active, over } = event;

    if (!over || !active) {
     setActiveId(null);
     setDragOverGroup(null);
     activeIdRef.current = null;
     return;
    }

    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;

    // Handle Group to Group dragging
    if (
     activeData?.type === DRAG_TYPES.GROUP &&
     overData?.type === DRAG_TYPES.GROUP
    ) {
     const activeGroup = findGroup(active.id as string);
     const overGroup = findGroup(over.id as string);

     if (
      activeGroup &&
      overGroup &&
      !activeGroup.isFakeGroup &&
      !overGroup.isFakeGroup &&
      active.id !== over.id
     ) {
      mergeGroups(active.id as string, over.id as string);
     } else {
      const activeIndex = groups.findIndex((g) => g.groupId === active.id);
      const overIndex = groups.findIndex((g) => g.groupId === over.id);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
       setGroups((prev) => {
        const newGroups = arrayMove(prev, activeIndex, overIndex);
        return rebuildGroupsWithFake(newGroups);
       });
      }
     }
    }

    // Handle View dragging (ENHANCED WITH VIEW-TO-GROUP SUPPORT)
    if (activeData?.type === DRAG_TYPES.VIEW && activeData.view) {
     const overContainer = findContainer(over.id as string);
     const activeContainer = findContainer(active.id as string);

     // Case 1: Dragging view to fake group
     const targetGroup = overContainer ? findGroup(overContainer) : null;
     if (targetGroup?.isFakeGroup) {
      createNewGroupWithView(activeData.view, targetGroup.groupIdx);
     }
     // Case 2: NEW - Dragging view to a different real group
     else if (
      overData?.type === DRAG_TYPES.GROUP &&
      overContainer &&
      activeContainer &&
      overContainer !== activeContainer
     ) {
      const sourceGroup = findGroup(activeContainer);
      const targetGroup = findGroup(overContainer);

      if (
       sourceGroup &&
       targetGroup &&
       !sourceGroup.isFakeGroup &&
       !targetGroup.isFakeGroup
      ) {
       setGroups((prev) => {
        const newGroups = [...prev];

        // Find source and target group indices
        const sourceGroupIndex = newGroups.findIndex(
         (g) => g.groupId === activeContainer
        );
        const targetGroupIndex = newGroups.findIndex(
         (g) => g.groupId === overContainer
        );

        if (sourceGroupIndex === -1 || targetGroupIndex === -1) return prev;

        const sourceGroupData = newGroups[sourceGroupIndex];
        const targetGroupData = newGroups[targetGroupIndex];

        // Find the view in source group
        const viewIndex = sourceGroupData.views.findIndex(
         (v) => v.id === active.id
        );
        if (viewIndex === -1) return prev;

        const viewToMove = {
         ...sourceGroupData.views[viewIndex],
         groupId: overContainer,
        };

        // Remove view from source group
        newGroups[sourceGroupIndex] = {
         ...sourceGroupData,
         views: sourceGroupData.views.filter((v) => v.id !== active.id),
        };

        // Add view to target group
        newGroups[targetGroupIndex] = {
         ...targetGroupData,
         views: [...targetGroupData.views, viewToMove],
        };

        // Filter out empty groups and rebuild with fake groups
        return rebuildGroupsWithFake(
         newGroups.filter(
          (group) => group.views.length > 0 || group.isFakeGroup
         )
        );
       });
      }
     }
     // Case 3: Dragging view within same group
     else if (activeContainer === overContainer && active.id !== over.id) {
      setGroups((prev) => {
       const newGroups = [...prev];
       const containerIndex = newGroups.findIndex(
        (g) => g.groupId === activeContainer
       );
       const container = newGroups[containerIndex];

       if (!container) return prev;

       const oldIndex = container.views.findIndex((v) => v.id === active.id);
       const newIndex = container.views.findIndex((v) => v.id === over.id);

       if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newGroups[containerIndex] = {
         ...container,
         views: arrayMove(container.views, oldIndex, newIndex),
        };
       }

       return rebuildGroupsWithFake(newGroups);
      });
     }
    }

    setActiveId(null);
    setDragOverGroup(null);
    activeIdRef.current = null;
   } catch (error) {
    console.error("Error in drag end:", error);
    // Ensure cleanup even on error
    setActiveId(null);
    setDragOverGroup(null);
    activeIdRef.current = null;
   }
  },
  [findContainer, findGroup, groups, createNewGroupWithView, mergeGroups]
 );

 const activeItem = useMemo((): ActiveItem | null => {
  if (!activeId) return null;

  const group = findGroup(activeId);
  if (group) return { type: DRAG_TYPES.GROUP, item: group };

  const view = findViewById(activeId);
  if (view) return { type: DRAG_TYPES.VIEW, item: view };

  return null;
 }, [activeId, findGroup, findViewById]);

 const sortedGroups = useMemo(
  () => [...groups].sort((a, b) => a.groupIdx - b.groupIdx),
  [groups]
 );

 console.log("This is something", { sortedGroups });

 return (
  <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
   <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    modifiers={[restrictToVerticalAxis]}
   >
    <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
     {sortedGroups.map((group) => (
      <SortableGroup
       key={group.groupId}
       group={group}
       isDropTarget={dragOverGroup === group.groupId}
      >
       {group.views.map((view) => (
        <SortableView key={view.id} view={view} groupEnabled={group.enabled} />
       ))}
      </SortableGroup>
     ))}
    </SortableContext>

    <DragOverlay>
     {activeItem?.type === DRAG_TYPES.VIEW && (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-90">
       <div className="grid grid-cols-4 gap-3 items-center">
        <div className="flex items-center gap-2">
         <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
         <span className="text-sm font-medium">
          {(activeItem.item as View).columnId}
         </span>
        </div>
        <div className="flex items-center gap-2">
         <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
         <span className="text-sm">{(activeItem.item as View).columnType}</span>
        </div>
        <span className="text-sm">{(activeItem.item as View).operator}</span>
        <span className="text-sm">{(activeItem.item as View).value}</span>
       </div>
      </div>
     )}

     {activeItem?.type === DRAG_TYPES.GROUP && (
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 shadow-lg opacity-90">
       <h3 className="font-semibold text-purple-600 text-sm">
        {(activeItem.item as Group).title}
       </h3>
       <div className="text-xs text-gray-500 mt-1">
        {(activeItem.item as Group).views.length} filter(s)
       </div>
       <div className="text-xs text-blue-600 mt-1 font-medium">
        Drop on another group to merge
       </div>
      </div>
     )}
    </DragOverlay>
   </DndContext>
  </div>
 );
};

export default App;
