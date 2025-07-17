"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
 DndContext,
 closestCenter,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
 MeasuringStrategy,
} from "@dnd-kit/core";
import {
 restrictToVerticalAxis,
 restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
 DRAG_TYPES,
 useViewsFilterStore,
 ViewsFilterProvider,
} from "@/app/views-filter/context";
import { DraggableGroup, GroupDropZone } from "@/app/views-filter/group";
import { DraggableView } from "@/app/views-filter/view";
import { ViewFilterOverlay } from "@/app/views-filter/overlay";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export default function FilterViewList() {
 const {
  createGroupWithView,
  moveView,
  moveGroupViews,
  reorderGroups,
  getViewById,
  getGroupById,
  groups,
  setOverActiveId,
  setActiveItem,
  setIsDragging,
  isDragging,
  overActiveId,
  activeItem,
 } = useViewsFilterStore();

 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: {
    distance: 0,
   },
  }),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  })
 );

 const findGroup = useCallback(
  (groupId) => {
   return getGroupById(groupId) || null;
  },
  [getGroupById]
 );

 const handleCreateNewGroupWithView = useCallback(
  (view, position) => {
   const contextView = {
    id: view.id,
    columnId: view.columnId,
    groupId: view.groupId,
    values: null,
    subField: null,
   };
   createGroupWithView(contextView, position);
  },
  [createGroupWithView]
 );

 const handleMoveViewToGroup = useCallback(
  (viewId, targetGroupId, insertIndex) => {
   const actualIndex = insertIndex >= 0 ? insertIndex : -1;

   // Find current group
   const viewData = getViewById(viewId);
   if (!viewData) return;

   // Prevent moving to the same position
   if (viewData.groupId === targetGroupId) {
    const currentGroup = getGroupById(targetGroupId);
    if (currentGroup) {
     const currentIndex = currentGroup.views.findIndex((v) => v.id === viewId);
     if (
      currentIndex === actualIndex ||
      (actualIndex === -1 && currentIndex === currentGroup.views.length - 1)
     ) {
      return; // No change needed
     }
    }
   }

   moveView(viewId, viewData.groupId, targetGroupId, actualIndex);
  },
  [moveView, getViewById, getGroupById]
 );

 const handleMoveGroupViewsToGroup = useCallback(
  (sourceGroupId, targetGroupId, insertIndex = -1) => {
   // Prevent moving to the same group
   if (sourceGroupId === targetGroupId) return;

   const actualIndex = insertIndex >= 0 ? insertIndex : -1;
   moveGroupViews(sourceGroupId, targetGroupId, actualIndex);
  },
  [moveGroupViews]
 );

 const handleReorderGroups = useCallback(
  (sourceGroupId, targetIndex) => {
   const currentIndex = groups.findIndex((g) => g.groupId === sourceGroupId);
   // Prevent reordering to the same position
   if (currentIndex === targetIndex) return;

   reorderGroups(sourceGroupId, targetIndex);
  },
  [reorderGroups, groups]
 );

 const handleDragStart = useCallback(
  (event) => {
   const activeData = event.active.data.current;
   setActiveItem(activeData);
   setOverActiveId(null);
   setIsDragging(true);
  },
  [setActiveItem, setOverActiveId, setIsDragging]
 );

 const handleDragOver = useCallback(
  (event) => {
   const { over } = event;
   if (
    over &&
    (over?.id.toString().startsWith("view-drop-") ||
     over?.id.toString().startsWith("group-drop-"))
   ) {
    console.log("This is something", { overId: over?.id, overActiveId });

    setOverActiveId(over?.id || null);
    return;
   }
  },
  [setOverActiveId]
 );

 const handleDragCancel = useCallback(() => {
  setActiveItem(null);
  setIsDragging(false);
  setOverActiveId(null);
 }, [setActiveItem, setIsDragging, setOverActiveId]);

 const handleDragEnd = useCallback(
  (event) => {
   const { active, over } = event;

   // Always reset drag state first
   setActiveItem(null);
   setIsDragging(false);
   setOverActiveId(null);

   if (!over || active.id === over.id) return;

   const activeData = active.data.current;
   const overData = over.data.current;

   // Add validation to prevent invalid operations
   if (!activeData || !overData) return;

   // Handle View dragging
   if (activeData?.type === DRAG_TYPES.VIEW) {
    const activeView = activeData.view;
    if (!activeView) return;

    // Drop on group drop zone (create new group)
    if (overData?.type === "GROUP_DROP_ZONE") {
     handleCreateNewGroupWithView(activeView, overData.position);
     return;
    }

    // Drop on view drop zone (insert at position)
    if (overData?.type === "VIEW_DROP_ZONE") {
     handleMoveViewToGroup(activeView.id, overData.groupId, overData.position);
     return;
    }

    // Drop on view (insert before/after)
    if (overData?.type === DRAG_TYPES.VIEW) {
     const targetView = overData.view;
     if (!targetView) return;

     const targetGroup = findGroup(targetView.groupId);
     if (targetGroup) {
      const targetIndex = targetGroup.views.findIndex(
       (v) => v.id === targetView.id
      );
      if (targetIndex >= 0) {
       handleMoveViewToGroup(activeView.id, targetGroup.groupId, targetIndex);
      }
     }
     return;
    }

    // Drop on group (append to end)
    if (overData?.type === DRAG_TYPES.GROUP) {
     const targetGroup = overData.group;
     if (targetGroup) {
      handleMoveViewToGroup(activeView.id, targetGroup.groupId, -1);
     }
     return;
    }
   }

   if (activeData?.type === DRAG_TYPES.GROUP) {
    const activeGroup = activeData.group;
    if (!activeGroup) return;

    if (overData?.type === "GROUP_DROP_ZONE") {
     handleReorderGroups(activeGroup.groupId, overData.position);
     return;
    }

    if (overData?.type === "VIEW_DROP_ZONE") {
     handleMoveGroupViewsToGroup(
      activeGroup.groupId,
      overData.groupId,
      overData.position
     );
     return;
    }

    if (overData?.type === DRAG_TYPES.VIEW) {
     const targetView = overData.view;
     if (!targetView) return;

     const targetGroup = findGroup(targetView.groupId);
     if (targetGroup) {
      const targetIndex = targetGroup.views.findIndex(
       (v) => v.id === targetView.id
      );
      if (targetIndex >= 0) {
       handleMoveGroupViewsToGroup(
        activeGroup.groupId,
        targetGroup.groupId,
        targetIndex
       );
      }
     }
     return;
    }

    // Drop on group (append group's views to end)
    if (overData?.type === DRAG_TYPES.GROUP) {
     const targetGroup = overData.group;
     if (targetGroup && activeGroup.groupId !== targetGroup.groupId) {
      handleMoveGroupViewsToGroup(activeGroup.groupId, targetGroup.groupId, -1);
     }
     return;
    }
   }
  },
  [
   findGroup,
   handleCreateNewGroupWithView,
   handleMoveViewToGroup,
   handleMoveGroupViewsToGroup,
   handleReorderGroups,
   setActiveItem,
   setIsDragging,
   setOverActiveId,
  ]
 );

 const memoizedGroups = useMemo(() => groups, [groups]);

 return (
  <div className="h-full w-full max-w-4xl mx-auto overflow-hidden">
   <ViewsFilterProvider initialGroups={memoizedGroups}>
    <div
     className="h-[1000px] pr-2 relative py-5"
     style={{
      overflowY: !isDragging ? "auto" : "hidden",
      touchAction: isDragging ? "none" : "auto",
     }}
    >
     <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      measuring={{
       droppable: {
        strategy: MeasuringStrategy.Always,
       },
      }}
     >
      {memoizedGroups.map((group, groupIndex) => (
       <React.Fragment key={group.groupId}>
        <DraggableGroup group={group} position={groupIndex}>
         {group.views.map((view, viewIndex) => (
          <React.Fragment key={view.id}>
           <DraggableView
            view={view}
            groupId={group.groupId}
            position={viewIndex}
            isLast={viewIndex === group.views.length - 1}
            isFirst={viewIndex === 0}
           />
          </React.Fragment>
         ))}
        </DraggableGroup>
       </React.Fragment>
      ))}

      <ViewFilterOverlay />
     </DndContext>
    </div>
   </ViewsFilterProvider>
  </div>
 );
}
