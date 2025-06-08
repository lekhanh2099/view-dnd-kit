"use client";

import React, { useState, useMemo } from "react";
import {
 DndContext,
 DragOverlay,
 closestCenter,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
} from "@dnd-kit/core";
import {
 arrayMove,
 SortableContext,
 sortableKeyboardCoordinates,
 verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Plus, GripVertical, Trash2 } from "lucide-react";

// Constants
const DRAG_TYPES = {
 VIEW: "view",
 GROUP: "group",
 NEW_GROUP_ZONE: "new-group-zone",
};

const NEW_GROUP_ZONE_ID = "new-group-zone";

// Utility functions
function generateId() {
 return Math.random().toString(36).substr(2, 9);
}
function getMockData() {
 return [
  {
   groupId: "groupId_1",
   groupIdx: 3,
   views: [
    {
     columnId: "columnId_1_group_1",
     groupId: "groupId_1",
     id: "1ib6b9b9ys9v3",
     operator: "=",
     readOnly: false,
     excludeOperators: ["hasTag"],
     filterType: "multipleLines",
     realIdx: 1,
    },
    {
     columnId: "columnId_2_group_1",
     groupId: "groupId_1",
     id: "3vzrzfrtqomtj",
     operator: "=",
     readOnly: false,
     excludeOperators: ["hasTag"],
     filterType: "multipleLines",
     realIdx: 2,
    },
    {
     columnId: "columnId_3_group_1",
     groupId: "groupId_1",
     id: "f1uvuo1vt18vn",
     operator: "=",
     readOnly: false,
     excludeOperators: [],
     filterType: "language",
     realIdx: 3,
    },
   ],
   disabled: false,
   hasGroupId: true,
   status: "enabled",
  },
  {
   groupId: "group_22222",
   groupIdx: 1,
   views: [
    {
     columnId: "columnId_11111_group_2222222",
     id: "pmytyjnszz5pl",
     groupId: "",
     operator: "=",
     readOnly: false,
     excludeOperators: ["hasTag"],
     filterType: "_publicRecordId",
     realIdx: 0,
    },
   ],
   disabled: false,
   hasGroupId: false,
  },

  {
   groupId: "group_3333",
   groupIdx: 5,
   views: [
    {
     columnId: "columnId_11111_group_333",
     groupId: "group_3333",
     id: "1ib6b999trs69",
     operator: "=",
     readOnly: false,
     excludeOperators: ["hasTag"],
     filterType: "multipleLines",
     realIdx: 4,
    },
    {
     columnId: "columnId_22222_group_333",
     groupId: "group_3333",
     id: "7qipill27q49q",
     operator: "=",
     readOnly: false,
     excludeOperators: [],
     filterType: "language",
     realIdx: 5,
    },
   ],
   disabled: false,
   hasGroupId: true,
   status: "enabled",
  },
 ];
}

// Sortable Filter View Component
function SortableView({ view }) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({
  id: view.id,
  data: { type: DRAG_TYPES.VIEW, view },
 });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
 };

 return (
  <div
   ref={setNodeRef}
   style={style}
   className={`bg-white border border-gray-200 rounded-lg p-4 mb-3`}
  >
   <div className="flex items-center justify-end mb-3">
    <div className="flex items-center gap-2">
     <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 mr-auto"
     >
      <GripVertical size={14} />
     </div>
    </div>
   </div>

   <div className="text-indigo-700">{view.columnId}</div>
  </div>
 );
}

// Sortable Group Component
function SortableGroup({ group, children }) {
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
  data: { type: DRAG_TYPES.GROUP, group },
 });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.7 : 1,
 };

 return (
  <div
   ref={setNodeRef}
   style={style}
   className={`border-2 border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 ${
    isOver ? "border-blue-300 bg-blue-50" : ""
   } ${!group.enabled ? "opacity-60" : ""}`}
  >
   <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-4">
     <h3 className="font-semibold text-purple-600 text-sm">{group.groupId}</h3>
    </div>

    <div className="flex items-center gap-2">
     <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 ml-2"
     >
      <GripVertical size={16} />
     </div>
    </div>
   </div>

   {children}
  </div>
 );
}

// Fixed Drop Zone for Creating New Groups
function NewGroupDropZone({ zoneId }) {
 const { setNodeRef, isOver } = useSortable({
  id: zoneId,
  data: { type: DRAG_TYPES.NEW_GROUP_ZONE },
 });

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

function useDragAndDrop(groups, setGroups) {
 const zoneIds = useMemo(() => {
  const ids = [NEW_GROUP_ZONE_ID + "-top"];
  groups.forEach((_, index) => {
   ids.push(NEW_GROUP_ZONE_ID + "-" + index);
  });
  return ids;
 }, [groups.length]);

 // Memoized items for better performance
 const allItems = useMemo(
  () => [
   ...groups.map((group) => group.groupId),
   ...groups.flatMap((group) => group.views.map((view) => view.id)),
   ...zoneIds,
  ],
  [groups, zoneIds]
 );

 const findContainer = useMemo(
  () => (id) => {
   // Check if it's a new group zone
   if (id.startsWith(NEW_GROUP_ZONE_ID)) return NEW_GROUP_ZONE_ID;

   const group = groups.find((group) => group.groupId === id);
   if (group) return id;

   for (const group of groups) {
    if (group.views.find((view) => view.id === id)) {
     return group.groupId;
    }
   }
   return null;
  },
  [groups]
 );

 const handleViewDragOver = useMemo(
  () => (active, over, activeContainer, overContainer) => {
   if (
    !activeContainer ||
    !overContainer ||
    activeContainer === overContainer ||
    overContainer === NEW_GROUP_ZONE_ID
   ) {
    return;
   }

   setGroups((prev) => {
    const activeGroupIndex = prev.findIndex(
     (group) => group.groupId === activeContainer
    );
    const overGroupIndex = prev.findIndex(
     (group) => group.groupId === overContainer
    );

    const activeView = prev[activeGroupIndex]?.views.find(
     (view) => view.id === active.id
    );

    if (!activeView) return prev;

    const newGroups = [...prev];

    // Remove from active container
    newGroups[activeGroupIndex] = {
     ...newGroups[activeGroupIndex],
     views: newGroups[activeGroupIndex].views.filter(
      (view) => view.id !== active.id
     ),
    };

    // Update the view's groupId
    const updatedView = { ...activeView, groupId: overContainer };

    // Add to over container
    if (over.id === overContainer) {
     newGroups[overGroupIndex] = {
      ...newGroups[overGroupIndex],
      views: [...newGroups[overGroupIndex].views, updatedView],
     };
    } else {
     const overIndex = newGroups[overGroupIndex].views.findIndex(
      (view) => view.id === over.id
     );
     newGroups[overGroupIndex] = {
      ...newGroups[overGroupIndex],
      views: [
       ...newGroups[overGroupIndex].views.slice(0, overIndex),
       updatedView,
       ...newGroups[overGroupIndex].views.slice(overIndex),
      ],
     };
    }

    // Remove empty groups
    return newGroups.filter((group) => group.views.length > 0);
   });
  },
  [setGroups]
 );

 const createNewGroupWithView = useMemo(
  () => (activeView) => {
   setGroups((prev) => {
    const newGroupId = generateId();
    const maxGroupIdx = Math.max(...prev.map((g) => g.groupIdx));

    const activeGroupIndex = prev.findIndex((group) =>
     group.views.some((view) => view.id === activeView.id)
    );

    let newGroups = [...prev];

    // Remove from current group
    if (activeGroupIndex !== -1) {
     newGroups[activeGroupIndex] = {
      ...newGroups[activeGroupIndex],
      views: newGroups[activeGroupIndex].views.filter(
       (view) => view.id !== activeView.id
      ),
     };
    }

    // Remove empty groups
    newGroups = newGroups.filter((group) => group.views.length > 0);

    // Create new group with this view
    const newGroup = {
     groupId: newGroupId,
     groupIdx: maxGroupIdx + 1,
     title: "AND CONDITIONS",
     enabled: true,
     views: [{ ...activeView, groupId: newGroupId }],
     disabled: false,
     hasGroupId: true,
     status: "enabled",
    };

    return [...newGroups, newGroup];
   });
  },
  [setGroups]
 );

 const reorderGroups = useMemo(
  () => (activeId, overId) => {
   setGroups((prev) => {
    const oldIndex = prev.findIndex((group) => group.groupId === activeId);
    const newIndex = prev.findIndex((group) => group.groupId === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
     return prev;

    const reorderedGroups = arrayMove(prev, oldIndex, newIndex);

    return reorderedGroups.map((group, index) =>
     group && typeof group === "object"
      ? { ...group, groupIdx: index + 1 }
      : group
    );
   });
  },
  [setGroups]
 );

 const reorderViewsInGroup = useMemo(
  () => (active, over, activeContainer, currentGroups) => {
   const containerIndex = currentGroups.findIndex(
    (group) => group.groupId === activeContainer
   );
   const container = currentGroups[containerIndex];

   if (!container) return;

   const oldIndex = container.views.findIndex((view) => view.id === active.id);
   const newIndex = container.views.findIndex((view) => view.id === over.id);

   if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
    setGroups((prev) => {
     const newGroups = [...prev];
     const currentContainer = newGroups[containerIndex];
     if (currentContainer) {
      newGroups[containerIndex] = {
       ...currentContainer,
       views: arrayMove(currentContainer.views, oldIndex, newIndex),
      };
     }
     return newGroups;
    });
   }
  },
  [setGroups]
 );

 const mergeGroups = useMemo(
  () => (activeGroupId, targetGroupId) => {
   setGroups((prev) => {
    const activeGroupIndex = prev.findIndex(
     (group) => group.groupId === activeGroupId
    );
    const targetGroupIndex = prev.findIndex(
     (group) => group.groupId === targetGroupId
    );

    if (activeGroupIndex === -1 || targetGroupIndex === -1) return prev;

    const activeGroup = prev[activeGroupIndex];
    const targetGroup = prev[targetGroupIndex];

    // Update all views in the active group to belong to the target group
    const updatedViews = activeGroup.views.map((view) => ({
     ...view,
     groupId: targetGroupId,
    }));

    const newGroups = [...prev];

    // Add active group's views to target group
    newGroups[targetGroupIndex] = {
     ...targetGroup,
     views: [...targetGroup.views, ...updatedViews],
    };

    // Remove the active group
    newGroups.splice(activeGroupIndex, 1);

    // Reindex remaining groups
    return newGroups.map((group, index) => ({
     ...group,
     groupIdx: index + 1,
    }));
   });
  },
  [setGroups]
 );

 return {
  allItems,
  zoneIds,
  findContainer,
  handleViewDragOver,
  createNewGroupWithView,
  reorderGroups,
  reorderViewsInGroup,
  mergeGroups,
 };
}

export default function App() {
 const [groups, setGroups] = useState(getMockData);
 const [activeId, setActiveId] = useState(null);

 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: {
    distance: 8,
   },
  }),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  })
 );

 const {
  allItems,
  zoneIds,
  findContainer,
  handleViewDragOver,
  createNewGroupWithView,
  reorderGroups,
  reorderViewsInGroup,
  mergeGroups,
 } = useDragAndDrop(groups, setGroups);

 // Handler functions
 const handleUpdateView = (viewId, updates) => {
  setGroups((prev) =>
   prev.map((group) => ({
    ...group,
    views: group.views.map((view) =>
     view.id === viewId ? { ...view, ...updates } : view
    ),
   }))
  );
 };

 const handleDeleteView = (viewId) => {
  setGroups(
   (prev) =>
    prev
     .map((group) => ({
      ...group,
      views: group.views.filter((view) => view.id !== viewId),
     }))
     .filter((group) => group.views.length > 0) // Remove empty groups
  );
 };

 const handleUpdateGroup = (groupId, updates) => {
  setGroups((prev) =>
   prev.map((group) =>
    group.groupId === groupId ? { ...group, ...updates } : group
   )
  );
 };

 const handleDeleteGroup = (groupId) => {
  setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
 };

 const handleDragStart = useMemo(
  () => (event) => {
   setActiveId(event.active.id);
  },
  []
 );

 function handleDragOver(event) {
  const { active, over } = event;

  if (!over) return;

  const activeData = active.data.current;

  // Don't handle group drag over - groups can only be reordered
  if (activeData?.type === DRAG_TYPES.GROUP) return;

  // Handle view drag over
  if (activeData?.type === DRAG_TYPES.VIEW) {
   const activeContainer = findContainer(active.id);
   const overContainer = findContainer(over.id);

   // Skip if dropping on new group zone (handle in dragEnd)
   if (overContainer === NEW_GROUP_ZONE_ID) return;

   handleViewDragOver(active, over, activeContainer, overContainer);
  }
 }

 function handleDragEnd(event) {
  const { active, over } = event;

  if (!over) {
   setActiveId(null);
   return;
  }

  const activeData = active.data.current;
  const overData = over.data.current;

  // Handle group operations
  if (activeData?.type === DRAG_TYPES.GROUP) {
   // Handle group dropped on another group (merge groups)
   if (overData?.type === DRAG_TYPES.GROUP && active.id !== over.id) {
    mergeGroups(active.id, over.id);
    setActiveId(null);
    return;
   }

   // Handle group reordering (when dropped on empty space or between groups)
   if (overData?.type === DRAG_TYPES.GROUP && active.id !== over.id) {
    reorderGroups(active.id, over.id);
    setActiveId(null);
    return;
   }
  }

  // Handle view operations
  if (activeData?.type === DRAG_TYPES.VIEW) {
   // Handle creating new group when dropped on new group zone
   if (overData?.type === DRAG_TYPES.NEW_GROUP_ZONE) {
    createNewGroupWithView(activeData.view);
    setActiveId(null);
    return;
   }

   // Handle reordering within same container
   const activeContainer = findContainer(active.id);
   const overContainer = findContainer(over.id);

   if (
    activeContainer === overContainer &&
    activeContainer !== NEW_GROUP_ZONE_ID &&
    active.id !== over.id
   ) {
    reorderViewsInGroup(active, over, activeContainer, groups);
   }
  }

  setActiveId(null);
 }

 const activeItem = useMemo(() => {
  if (!activeId) return null;

  const group = groups.find((g) => g.groupId === activeId);
  if (group) return { type: DRAG_TYPES.GROUP, item: group };

  const view = groups.flatMap((g) => g.views).find((v) => v.id === activeId);
  if (view) return { type: DRAG_TYPES.VIEW, item: view };

  return null;
 }, [activeId, groups]);

 const sortedGroups = useMemo(
  () => groups.sort((a, b) => a.groupIdx - b.groupIdx),
  [groups]
 );

 return (
  <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
   <h2 className="text-2xl font-bold mb-6 text-gray-800">
    Filter Groups Management
   </h2>

   <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
   >
    <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
     <NewGroupDropZone zoneId={zoneIds[0]} />

     {sortedGroups.map((group, index) => (
      <React.Fragment key={group.groupId}>
       <SortableGroup group={group}>
        {group.views.map((view) => (
         <SortableView key={view.id} view={view} />
        ))}
       </SortableGroup>
       <NewGroupDropZone zoneId={zoneIds[index + 1]} />
      </React.Fragment>
     ))}
    </SortableContext>

    <DragOverlay>
     {activeItem?.type === DRAG_TYPES.VIEW && (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-90">
       <div className="grid grid-cols-4 gap-3 items-center">
        <div className="flex items-center gap-2">
         <div className="text-red-500 rounded-sm">This item dragging</div>
        </div>
       </div>
      </div>
     )}

     {activeItem?.type === DRAG_TYPES.GROUP && (
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 shadow-lg opacity-90">
       <h3 className="font-semibold text-purple-600 text-sm">What is it?</h3>
      </div>
     )}
    </DragOverlay>
   </DndContext>
  </div>
 );
}
