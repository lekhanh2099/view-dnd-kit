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
 useDraggable,
 useDroppable,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import {
 restrictToVerticalAxis,
 restrictToWindowEdges,
} from "@dnd-kit/modifiers";

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
 item: {
  view?: View;
  group?: Group;
 };
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

function arrayMove<T>(array: T[], from: number, to: number): T[] {
 const newArray = [...array];
 const item = newArray.splice(from, 1)[0];
 newArray.splice(to, 0, item);
 return newArray;
}

interface DraggableViewProps {
 view: View;
 isDraggedOver?: boolean;
 activeItem?: ActiveItem;
 dragOverId?: string | null;
 activeId?: string | null;
 viewIndex?: number;
 activeViewIndex?: number;
 isDropTarget?: boolean;
}

const DraggableView = React.memo<DraggableViewProps>(
 ({ view, activeItem, isDropTarget }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
   useDraggable({
    id: view.id,
    data: { type: DRAG_TYPES.VIEW, view } satisfies DragData,
   });

  const { setNodeRef: setDropRef } = useDroppable({
   id: view.id,
   data: { type: DRAG_TYPES.VIEW, view } satisfies DragData,
  });

  const shouldAnimateUp = isDropTarget && activeItem?.type === DRAG_TYPES.VIEW;

  const style = useMemo(
   () => ({
    transform: transform
     ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
     : undefined,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : 1,
   }),
   [transform, isDragging]
  );

  return (
   <div
    ref={(node) => {
     setNodeRef(node);
     setDropRef(node);
    }}
    style={style}
    className={`
      bg-white border-2 rounded-lg p-4 mb-3 
      transition-all duration-300 ease-out
      ${shouldAnimateUp ? "transform translate-y-16" : ""}
      ${
       isDropTarget && !shouldAnimateUp
        ? "border-blue-400 bg-blue-50 -translate-y-16"
        : ""
      }
    `}
   >
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-2">
      <div
       className={`w-3 h-3 rounded-sm flex-shrink-0 transition-all duration-200 ${
        isDropTarget ? "bg-blue-500 animate-pulse" : "bg-red-500"
       }`}
      ></div>
      <p
       className={`font-medium text-sm transition-colors duration-200 ${
        isDropTarget ? "text-blue-800" : "text-gray-800"
       }`}
      >
       {view.columnId}
      </p>
     </div>
     <div
      {...attributes}
      {...listeners}
      className={`
        cursor-grab active:cursor-grabbing p-2 rounded
        transition-all duration-200 ease-out text-gray-400
      `}
     >
      <GripVertical size={16} />
     </div>
    </div>
   </div>
  );
 }
);

DraggableView.displayName = "DraggableView";

interface DraggableGroupProps {
 group: Group;
 children: React.ReactNode;
 isDropTarget?: boolean;
 isDraggedOver?: boolean;
 isBeingDragged?: boolean;
 activeItem?: ActiveItem;
 dragOverId?: string | null;
 activeId?: string | null;
 activeViewIndex?: number;
}

const DraggableGroup = React.memo<DraggableGroupProps>(
 ({
  group,
  children,
  isDropTarget = false,
  isDraggedOver = false,
  activeItem,
 }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
   useDraggable({
    id: group.groupId,
    data: { type: DRAG_TYPES.GROUP, group } satisfies DragData,
   });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
   id: group.groupId,
   data: { type: DRAG_TYPES.GROUP, group } satisfies DragData,
  });

  const style = useMemo(
   () => ({
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : 1,
    transform: transform
     ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
     : !isDragging
     ? ""
     : undefined,
   }),
   [transform, isDragging]
  );
  console.log("This is something", { group });

  if (group.isFakeGroup) {
   const showDropZone = isOver || isDraggedOver;

   return (
    <div
     ref={(node) => {
      setNodeRef(node);
      setDropRef(node);
     }}
     className="transition-all duration-300 ease-out w-full"
    >
     {showDropZone && activeItem && (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-4 mb-3 transition-all duration-300 animate-pulse">
       <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 opacity-70">
         <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0 animate-bounce"></div>
         <p className="text-blue-700 font-medium text-sm">
          Drop here to create new group
         </p>
        </div>
       </div>
      </div>
     )}
    </div>
   );
  }

  return (
   <div
    ref={(node) => {
     setNodeRef(node);
     setDropRef(node);
    }}
    style={style}
    className={`
      border-2 rounded-lg p-6 mb-6 bg-gray-50 relative
      transition-all duration-300 ease-out
      ${!group.enabled ? "opacity-60" : ""}
      
      ${isDragging ? "shadow-2xl" : ""}
      ${isDropTarget ? "border-green-400 bg-green-50" : ""}
    `}
   >
    <div className="flex items-center justify-between mb-4">
     <div className="flex items-center gap-4">
      <h3
       className={`font-semibold text-sm uppercase tracking-wide transition-colors duration-200 ${
        isDropTarget ? "text-green-700" : "text-purple-700"
       }`}
      >
       {group.title} ({group.views.length} items)
      </h3>
     </div>
     <div
      {...attributes}
      {...listeners}
      className={`
        cursor-grab active:cursor-grabbing p-2 rounded
        transition-all duration-200 ease-out text-gray-400
      `}
     >
      <GripVertical size={18} />
     </div>
    </div>
    <div className="transition-all duration-300 ease-out">{children}</div>
   </div>
  );
 }
);

DraggableGroup.displayName = "DraggableGroup";

const App: React.FC = () => {
 const [groups, setGroups] = useState<Group[]>(getMockData);
 const [activeId, setActiveId] = useState<string | null>(null);
 const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
 const [overId, setOverId] = useState<string | null>(null);

 const activeIdRef = useRef<string | null>(null);

 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: { distance: 8 },
  }),
  useSensor(KeyboardSensor)
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

     const newGroup: Group = {
      groupId: newGroupId,
      groupIdx: dropZoneIndex,
      title: "AND CONDITIONS",
      enabled: true,
      views: [{ ...activeView, groupId: newGroupId }],
      isFakeGroup: false,
     };

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
   setDragOverGroup(null);
   setOverId(null);
  } catch (error) {
   console.error("Error in drag start:", error);
  }
 }, []);

 const handleDragOver = useCallback(
  (event: DragOverEvent): void => {
   const { active, over } = event;

   if (!over) {
    setOverId(null);
    setDragOverGroup(null);
    return;
   }

   setOverId(over.id as string);

   const overContainer = findContainer(over.id as string);
   if (overContainer) {
    setDragOverGroup(overContainer);
   }
  },
  [findContainer, overId]
 );

 const handleDragEnd = useCallback(
  (event: DragEndEvent): void => {
   try {
    const { active, over } = event;

    if (!over || !active) {
     setActiveId(null);
     setDragOverGroup(null);
     setOverId(null);
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

    // Handle View dragging
    if (activeData?.type === DRAG_TYPES.VIEW && activeData.view) {
     const overContainer = findContainer(over.id as string);
     const activeContainer = findContainer(active.id as string);

     // Case 1: Dragging view to fake group
     const targetGroup = overContainer ? findGroup(overContainer) : null;
     if (targetGroup?.isFakeGroup) {
      createNewGroupWithView(activeData.view, targetGroup.groupIdx);
     }
     // Case 2: Dragging view to a different group
     else if (
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

        // Determine insertion position
        let insertionIndex = targetGroupData.views.length; // Default to end

        if (overData?.type === DRAG_TYPES.VIEW && over.id !== active.id) {
         // Dropping on a specific view
         const targetViewIndex = targetGroupData.views.findIndex(
          (v) => v.id === over.id
         );
         if (targetViewIndex !== -1) {
          insertionIndex = targetViewIndex;
         }
        } else {
         // Dropping on group container or empty space
         insertionIndex = targetGroupData.views.length;
        }

        // Insert at the calculated position
        const newViews = [...targetGroupData.views];
        newViews.splice(insertionIndex, 0, viewToMove);

        newGroups[targetGroupIndex] = {
         ...targetGroupData,
         views: newViews,
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

       const activeIndex = container.views.findIndex((v) => v.id === active.id);
       const overIndex = container.views.findIndex((v) => v.id === over.id);

       if (
        activeIndex !== -1 &&
        overIndex !== -1 &&
        activeIndex !== overIndex
       ) {
        newGroups[containerIndex] = {
         ...container,
         views: arrayMove(container.views, activeIndex, overIndex),
        };
       }

       return rebuildGroupsWithFake(newGroups);
      });
     }
    }

    setActiveId(null);
    setDragOverGroup(null);
    setOverId(null);
    activeIdRef.current = null;
   } catch (error) {
    console.error("Error in drag end:", error);
    setActiveId(null);
    setDragOverGroup(null);
    setOverId(null);
    activeIdRef.current = null;
   }
  },
  [findContainer, findGroup, groups, createNewGroupWithView, mergeGroups]
 );

 const activeItem = useMemo((): ActiveItem | null => {
  if (!activeId) return null;

  const group = findGroup(activeId);
  if (group) return { type: DRAG_TYPES.GROUP, item: { group } };

  const view = findViewById(activeId);
  if (view) return { type: DRAG_TYPES.VIEW, item: { view } };

  return null;
 }, [activeId, findGroup, findViewById]);

 const sortedGroups = useMemo(
  () => [...groups].sort((a, b) => a.groupIdx - b.groupIdx),
  [groups]
 );

 return (
  <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 !overflow-hidden">
   <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
    Filter Conditions
   </h1>

   <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
   >
    {sortedGroups.map((group) => (
     <DraggableGroup
      key={group.groupId}
      group={group}
      isDraggedOver={dragOverGroup === group.groupId}
      isDropTarget={dragOverGroup === group.groupId || overId === group.groupId}
      activeItem={activeItem}
      dragOverId={overId}
      activeId={activeId}
     >
      {group.views.map((view) => (
       <DraggableView
        key={view.id}
        view={view}
        isDraggedOver={overId === view.id}
        isDropTarget={overId === view.id}
        activeItem={activeItem}
        dragOverId={overId}
        activeId={activeId}
       />
      ))}
     </DraggableGroup>
    ))}

    <DragOverlay>
     {activeItem?.type === DRAG_TYPES.VIEW && (
      <div className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-2xl transform  transition-all duration-200">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
         <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0 animate-pulse"></div>
         <p className="text-gray-800 font-medium text-sm">
          {activeItem?.item?.view?.columnId}
         </p>
        </div>
        <div className="cursor-grabbing p-2 text-blue-500">
         <GripVertical size={16} />
        </div>
       </div>
      </div>
     )}
     {activeItem?.type === DRAG_TYPES.GROUP && (
      <div className="border-2 border-purple-400 rounded-lg p-6 bg-purple-50 shadow-2xl transform  transition-all duration-200">
       <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-purple-700 text-sm uppercase tracking-wide">
         {activeItem?.item?.group?.title} (
         {activeItem?.item?.group?.views.length} items)
        </h3>
        <div className="cursor-grabbing p-2 text-purple-500">
         <GripVertical size={18} />
        </div>
       </div>
       <div className="opacity-50">
        {activeItem?.item?.group?.views.map((view) => (
         <div
          key={view.id}
          className="bg-white border rounded p-2 mb-2 text-xs"
         >
          {view.columnId}
         </div>
        ))}
       </div>
      </div>
     )}
    </DragOverlay>
   </DndContext>
  </div>
 );
};

export default App;
