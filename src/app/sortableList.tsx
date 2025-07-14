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
 useDraggable,
 useDroppable,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import {
 restrictToVerticalAxis,
 restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { DRAG_TYPES, DraggableGroupProps, getMockData } from "@/app/utils";
const generateId = () => Math.random().toString(36).substr(2, 9);

const createFakeView = (groupId, insertIndex) => ({
 id: `fake-${groupId}-${insertIndex}`,
 groupId,
 insertIndex,
 isFakeView: true,
});

const createGroupMergeZone = (groupId, insertIndex) => ({
 id: `group-merge-${groupId}-${insertIndex}`,
 groupId,
 insertIndex,
 isGroupMergeZone: true,
});

const rebuildGroupsWithFake = (groups) => {
 const realGroups = groups.filter((g) => !g.isFakeGroup);
 const fakeGroups = [];

 for (let i = 0; i <= realGroups.length; i++) {
  fakeGroups.push({
   groupId: `fake-group-${i}`,
   groupIdx: i,
   title: "",
   enabled: true,
   views: [],
   isFakeGroup: true,
  });
 }

 const result = [];
 realGroups.forEach((group, index) => {
  result.push(fakeGroups[index]);
  result.push({ ...group, groupIdx: index });
 });
 result.push(fakeGroups[realGroups.length]);

 return result;
};

const FakeViewDropZone = React.memo(
 ({
  fakeView,
  isActive,
  activeItem,
 }: {
  fakeView: any;
  isActive: boolean;
  activeItem: any;
 }) => {
  const { setNodeRef } = useDroppable({
   id: fakeView.id,
   data: { type: DRAG_TYPES.FAKE_VIEW, fakeView },
  });

  const shouldShow = isActive && activeItem?.type === DRAG_TYPES.VIEW;

  return (
   <div
    ref={setNodeRef}
    className={`transition-all duration-300 ease-out ${
     shouldShow ? "h-12 mb-3" : "h-2"
    }`}
   >
    {shouldShow && (
     <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-dashed border-blue-400 rounded-lg h-full flex items-center justify-center animate-pulse">
      <div className="flex items-center gap-2 opacity-70">
       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
       <p className="text-blue-600 font-medium text-xs">Drop view here</p>
      </div>
     </div>
    )}
   </div>
  );
 }
);

FakeViewDropZone.displayName = "FakeViewDropZone";

const GroupMergeZone = React.memo(
 ({
  mergeZone,
  isActive,
  activeItem,
 }: {
  mergeZone: any;
  isActive: boolean;
  activeItem: any;
 }) => {
  const { setNodeRef } = useDroppable({
   id: mergeZone.id,
   data: { type: DRAG_TYPES.GROUP_MERGE_ZONE, mergeZone },
  });

  const shouldShow = isActive && activeItem?.type === DRAG_TYPES.GROUP;

  return (
   <div
    ref={setNodeRef}
    className={`transition-all duration-300 ease-out ${
     shouldShow ? "h-16 mb-3" : "h-1"
    }`}
   >
    {shouldShow && (
     <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-dashed border-purple-400 rounded-lg h-full flex items-center justify-center animate-pulse">
      <div className="flex items-center gap-2 opacity-70">
       <div className="w-3 h-3 bg-purple-500 rounded-sm animate-bounce"></div>
       <p className="text-purple-600 font-medium text-sm">Merge group here</p>
      </div>
     </div>
    )}
   </div>
  );
 }
);

GroupMergeZone.displayName = "GroupMergeZone";

const DraggableView = React.memo(
 ({
  view,
  activeItem,
  isDropTarget,
 }: {
  view: any;
  activeItem: any;
  isDropTarget: boolean;
 }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
   useDraggable({
    id: view.id,
    data: { type: DRAG_TYPES.VIEW, view },
   });

  const { setNodeRef: setDropRef } = useDroppable({
   id: view.id,
   data: { type: DRAG_TYPES.VIEW, view },
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
    className={`bg-white border-2 rounded-lg p-4 mb-3 transition-all duration-300 ease-out
          ${shouldAnimateUp ? "transform translate-y-16" : ""}
          ${
           isDropTarget && !shouldAnimateUp
            ? "border-blue-400 bg-blue-50 -translate-y-16"
            : ""
          }`}
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
      className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400"
     >
      <GripVertical size={16} />
     </div>
    </div>
   </div>
  );
 }
);

DraggableView.displayName = "DraggableView";

const DraggableGroup = React.memo(
 ({
  group,
  children,
  isDropTarget = false,
  isDraggedOver = false,
  activeItem,
 }: DraggableGroupProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
   useDraggable({
    id: group.groupId,
    data: { type: DRAG_TYPES.GROUP, group },
   });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
   id: group.groupId,
   data: { type: DRAG_TYPES.GROUP, group },
  });

  const style = useMemo(
   () => ({
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : 1,
    transform: transform
     ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
     : undefined,
   }),
   [transform, isDragging]
  );

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
    className={`border-2 rounded-lg p-6 mb-6 bg-gray-50 relative transition-all duration-300 ease-out
        ${!group.enabled ? "opacity-60" : ""}
        ${isDragging ? "shadow-2xl" : ""}
        ${isDropTarget ? "border-green-400 bg-green-50" : ""}`}
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
      className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400"
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

const App = () => {
 const [groups, setGroups] = useState(getMockData);
 const [activeId, setActiveId] = useState(null);
 const [dragOverGroup, setDragOverGroup] = useState(null);
 const [overId, setOverId] = useState(null);

 const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
 );

 const { groupIds, viewIds, fakeViewIds, groupMergeZoneIds } = useMemo(() => {
  const gIds = groups.map((g) => g.groupId);
  const vIds = groups.flatMap((g) => g.views.map((v) => v.id));
  const fvIds = groups.flatMap((group) =>
   !group.isFakeGroup
    ? Array.from(
       { length: group.views.length + 1 },
       (_, i) => createFakeView(group.groupId, i).id
      )
    : []
  );
  const gmzIds = groups.flatMap((group) =>
   !group.isFakeGroup
    ? Array.from(
       { length: group.views.length + 1 },
       (_, i) => createGroupMergeZone(group.groupId, i).id
      )
    : []
  );
  return {
   groupIds: gIds,
   viewIds: vIds,
   fakeViewIds: fvIds,
   groupMergeZoneIds: gmzIds,
  };
 }, [groups]);

 const lookupMaps = useMemo(() => {
  const groupMap = new Map();
  const viewMap = new Map();
  const viewToGroupMap = new Map();
  const fakeViewMap = new Map();
  const groupMergeZoneMap = new Map();

  groups.forEach((group) => {
   groupMap.set(group.groupId, group);

   if (!group.isFakeGroup) {
    for (let i = 0; i <= group.views.length; i++) {
     const fakeView = createFakeView(group.groupId, i);
     fakeViewMap.set(fakeView.id, fakeView);

     const groupMergeZone = createGroupMergeZone(group.groupId, i);
     groupMergeZoneMap.set(groupMergeZone.id, groupMergeZone);
    }
   }

   group.views.forEach((view) => {
    viewMap.set(view.id, view);
    viewToGroupMap.set(view.id, group.groupId);
   });
  });

  return { groupMap, viewMap, viewToGroupMap, fakeViewMap, groupMergeZoneMap };
 }, [groups]);

 const findContainer = useCallback(
  (id) => {
   if (groupIds.includes(id)) return id;
   const fakeView = lookupMaps.fakeViewMap.get(id);
   if (fakeView) return fakeView.groupId;
   const groupMergeZone = lookupMaps.groupMergeZoneMap.get(id);
   if (groupMergeZone) return groupMergeZone.groupId;
   return lookupMaps.viewToGroupMap.get(id) || null;
  },
  [
   groupIds,
   lookupMaps.viewToGroupMap,
   lookupMaps.fakeViewMap,
   lookupMaps.groupMergeZoneMap,
  ]
 );

 const findViewById = useCallback(
  (viewId) => {
   return lookupMaps.viewMap.get(viewId) || null;
  },
  [lookupMaps.viewMap]
 );

 const findGroup = useCallback(
  (groupId) => {
   return lookupMaps.groupMap.get(groupId) || null;
  },
  [lookupMaps.groupMap]
 );

 const createNewGroupWithView = useCallback((activeView, dropZoneIndex) => {
  setGroups((prev) => {
   const newGroupId = generateId();
   let newGroups = [...prev];

   // Remove view from source group
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
   const newGroup = {
    groupId: newGroupId,
    groupIdx: dropZoneIndex,
    title: "AND CONDITIONS",
    enabled: true,
    views: [{ ...activeView, groupId: newGroupId }],
    isFakeGroup: false,
   };

   // Replace fake group or add new group
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
 }, []);

 const mergeGroups = useCallback((sourceGroupId, targetGroupId) => {
  setGroups((prev) => {
   const newGroups = [...prev];
   const sourceIndex = newGroups.findIndex((g) => g.groupId === sourceGroupId);
   const targetIndex = newGroups.findIndex((g) => g.groupId === targetGroupId);

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
 }, []);

 const mergeGroupAtPosition = useCallback(
  (sourceGroupId, targetGroupId, insertIndex) => {
   setGroups((prev) => {
    const newGroups = [...prev];
    const sourceIndex = newGroups.findIndex((g) => g.groupId === sourceGroupId);
    const targetIndex = newGroups.findIndex((g) => g.groupId === targetGroupId);

    if (sourceIndex === -1 || targetIndex === -1) return prev;

    const sourceGroup = newGroups[sourceIndex];
    const targetGroup = newGroups[targetIndex];

    if (sourceGroup.isFakeGroup || targetGroup.isFakeGroup) return prev;

    const updatedViews = sourceGroup.views.map((view) => ({
     ...view,
     groupId: targetGroupId,
    }));

    // Insert views at specific position
    const newViews = [...targetGroup.views];
    newViews.splice(insertIndex, 0, ...updatedViews);

    newGroups[targetIndex] = {
     ...targetGroup,
     views: newViews,
    };

    newGroups.splice(sourceIndex, 1);

    return rebuildGroupsWithFake(
     newGroups.filter((group) => group.views.length > 0)
    );
   });
  },
  []
 );

 const handleDragStart = useCallback((event) => {
  const { active } = event;
  setActiveId(active.id);
  setDragOverGroup(null);
  setOverId(null);
 }, []);

 const handleDragOver = useCallback(
  (event) => {
   const { active, over } = event;

   if (!over) {
    setOverId(null);
    setDragOverGroup(null);
    return;
   }

   setOverId(over.id);
   const overContainer = findContainer(over.id);
   if (overContainer) {
    setDragOverGroup(overContainer);
   }
  },
  [findContainer]
 );

 const handleDragEnd = useCallback(
  (event) => {
   const { active, over } = event;

   // Reset state first
   setActiveId(null);
   setDragOverGroup(null);
   setOverId(null);

   if (!over || !active || active.id === over.id) {
    return;
   }

   const activeData = active.data.current;
   const overData = over.data.current;

   // Handle Group to Group Merge Zone dragging
   if (
    activeData?.type === DRAG_TYPES.GROUP &&
    overData?.type === DRAG_TYPES.GROUP_MERGE_ZONE
   ) {
    const activeGroup = findGroup(active.id);
    const mergeZone = overData.mergeZone;

    if (activeGroup && !activeGroup.isFakeGroup) {
     mergeGroupAtPosition(active.id, mergeZone.groupId, mergeZone.insertIndex);
    }
    return;
   }

   // Handle Group to Group dragging
   if (
    activeData?.type === DRAG_TYPES.GROUP &&
    overData?.type === DRAG_TYPES.GROUP
   ) {
    const activeGroup = findGroup(active.id);
    const overGroup = findGroup(over.id);

    if (!activeGroup || !overGroup) return;

    // Case 1: Dragging to fake group (reordering)
    if (overGroup.isFakeGroup) {
     if (activeGroup.isFakeGroup) return; // Can't drag fake group to fake group

     const realGroups = groups.filter((g) => !g.isFakeGroup);
     const activeIndex = realGroups.findIndex((g) => g.groupId === active.id);
     const targetIndex = overGroup.groupIdx;

     if (activeIndex !== -1 && targetIndex !== activeIndex) {
      const newRealGroups = [...realGroups];
      const [movedGroup] = newRealGroups.splice(activeIndex, 1);
      newRealGroups.splice(targetIndex, 0, movedGroup);

      setGroups(rebuildGroupsWithFake(newRealGroups));
     }
     return;
    }

    // Case 2: Dragging to real group (merging)
    if (
     !activeGroup.isFakeGroup &&
     !overGroup.isFakeGroup &&
     activeGroup.groupId !== overGroup.groupId
    ) {
     mergeGroups(activeGroup.groupId, overGroup.groupId);
     return;
    }
   }

   // Handle View dragging (existing logic)
   if (activeData?.type === DRAG_TYPES.VIEW && activeData.view) {
    const overContainer = findContainer(over.id);
    const activeContainer = findContainer(active.id);

    // Prevent same position drops
    if (activeContainer === overContainer && active.id === over.id) {
     return;
    }

    // Case 1: Dragging view to fake group
    const targetGroup = overContainer ? findGroup(overContainer) : null;
    if (targetGroup?.isFakeGroup) {
     createNewGroupWithView(activeData.view, targetGroup.groupIdx);
     return;
    }

    // Case 2: Dragging view to fake view (precise positioning)
    if (overData?.type === DRAG_TYPES.FAKE_VIEW && overData.fakeView) {
     const targetGroup = findGroup(overData.fakeView.groupId);
     const sourceGroup = findGroup(activeContainer);

     if (
      targetGroup &&
      sourceGroup &&
      !targetGroup.isFakeGroup &&
      !sourceGroup.isFakeGroup
     ) {
      setGroups((prev) => {
       const newGroups = prev.map((group) => ({
        ...group,
        views: [...group.views],
       }));

       const sourceGroupIndex = newGroups.findIndex(
        (g) => g.groupId === activeContainer
       );
       const targetGroupIndex = newGroups.findIndex(
        (g) => g.groupId === overContainer
       );

       if (sourceGroupIndex === -1 || targetGroupIndex === -1) return prev;

       const sourceGroupData = newGroups[sourceGroupIndex];
       const targetGroupData = newGroups[targetGroupIndex];

       const viewIndex = sourceGroupData.views.findIndex(
        (v) => v.id === active.id
       );
       if (viewIndex === -1) return prev;

       const viewToMove = {
        ...sourceGroupData.views[viewIndex],
        groupId: overContainer,
       };

       // Remove from source
       newGroups[sourceGroupIndex].views = sourceGroupData.views.filter(
        (v) => v.id !== active.id
       );

       // Add to target at specific position
       newGroups[targetGroupIndex].views.splice(
        overData.fakeView.insertIndex,
        0,
        viewToMove
       );

       return rebuildGroupsWithFake(
        newGroups.filter((group) => group.views.length > 0 || group.isFakeGroup)
       );
      });
     }
     return;
    }

    // Case 3: Moving within same group or to different group
    if (overContainer && activeContainer) {
     setGroups((prev) => {
      const newGroups = prev.map((group) => ({
       ...group,
       views: [...group.views],
      }));

      const sourceGroupIndex = newGroups.findIndex(
       (g) => g.groupId === activeContainer
      );
      const targetGroupIndex = newGroups.findIndex(
       (g) => g.groupId === overContainer
      );

      if (sourceGroupIndex === -1 || targetGroupIndex === -1) return prev;

      const sourceGroupData = newGroups[sourceGroupIndex];
      const targetGroupData = newGroups[targetGroupIndex];

      const viewIndex = sourceGroupData.views.findIndex(
       (v) => v.id === active.id
      );
      if (viewIndex === -1) return prev;

      const viewToMove = {
       ...sourceGroupData.views[viewIndex],
       groupId: overContainer,
      };

      // Remove from source
      newGroups[sourceGroupIndex].views = sourceGroupData.views.filter(
       (v) => v.id !== active.id
      );

      // Determine insertion position
      let insertionIndex = targetGroupData.views.length;

      if (
       overData?.type === DRAG_TYPES.VIEW &&
       activeContainer === overContainer
      ) {
       // Moving within same group
       const targetViewIndex = targetGroupData.views.findIndex(
        (v) => v.id === over.id
       );
       if (targetViewIndex !== -1) {
        insertionIndex = targetViewIndex;
       }
      } else if (overData?.type === DRAG_TYPES.VIEW) {
       // Moving to different group, drop on specific view
       const targetViewIndex = targetGroupData.views.findIndex(
        (v) => v.id === over.id
       );
       if (targetViewIndex !== -1) {
        insertionIndex = targetViewIndex;
       }
      }

      // Insert at calculated position
      newGroups[targetGroupIndex].views.splice(insertionIndex, 0, viewToMove);

      return rebuildGroupsWithFake(
       newGroups.filter((group) => group.views.length > 0 || group.isFakeGroup)
      );
     });
    }
   }
  },
  [
   findContainer,
   findGroup,
   groups,
   createNewGroupWithView,
   mergeGroups,
   mergeGroupAtPosition,
  ]
 );

 const activeItem = useMemo(() => {
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
  <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
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
     >
      {!group.isFakeGroup && (
       <>
        <FakeViewDropZone
         fakeView={createFakeView(group.groupId, 0)}
         isActive={overId === createFakeView(group.groupId, 0).id}
         activeItem={activeItem}
        />
        <GroupMergeZone
         mergeZone={createGroupMergeZone(group.groupId, 0)}
         isActive={overId === createGroupMergeZone(group.groupId, 0).id}
         activeItem={activeItem}
        />
        {group.views.map((view, index) => (
         <React.Fragment key={view.id}>
          <DraggableView
           view={view}
           isDropTarget={overId === view.id}
           activeItem={activeItem}
          />

          <FakeViewDropZone
           fakeView={createFakeView(group.groupId, index + 1)}
           isActive={overId === createFakeView(group.groupId, index + 1).id}
           activeItem={activeItem}
          />
          <GroupMergeZone
           mergeZone={createGroupMergeZone(group.groupId, 0)}
           isActive={overId === createGroupMergeZone(group.groupId, 0).id}
           activeItem={activeItem}
          />
         </React.Fragment>
        ))}
       </>
      )}
     </DraggableGroup>
    ))}

    <DragOverlay>
     {activeItem?.type === DRAG_TYPES.VIEW && (
      <div className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-2xl transform transition-all duration-200">
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
      <div className="border-2 border-purple-400 rounded-lg p-6 bg-purple-50 shadow-2xl transform transition-all duration-200">
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
