import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import z from "zod";
import { createContext, useContext, useEffect } from "react";

export const DRAG_TYPES = {
 VIEW: "view",
 GROUP: "group",
};

// Your existing types
export const IViewFilterSubFields = z
 .enum([
  "doNotTranslate",
  "notReadyForTranslation",
  "readyForTranslation",
  "unset",
  "locked",
  "lockAllLanguages",
  "_dependencyStatus",
  "_sourceStatus",
  "_tm",
  "isLengthViolated",
  "_metadata",
  "_lengthSetting",
  "_relativeTime",
  "_dateOnly",
  "_readOnly",
 ])
 .nullable();

export type IViewFilterSubField = z.infer<typeof IViewFilterSubFields>;

export const IViewFilter = z.object({
 columnId: z.string(),
 groupId: z.string(),
 id: z.string(),
 values: z.any(),
 subField: IViewFilterSubFields,
 hashColumnId: z.string().optional(),
 inheritedViewFilterId: z.string().optional(),
});

export type IViewFilter = z.infer<typeof IViewFilter>;

export type ISharedViewFilter = IViewFilter & {
 field?: string;
};

export type IGroupViewFilter = {
 id?: string;
 groupId: string;
 views: ISharedViewFilter[] | any[];
 disabled?: boolean;
 status?: "enabled" | "disabled";
 hasGroupId?: boolean;
 title?: string;
 type?: "AND" | "OR" | "FILTER";
};

// Drag and drop state types
export type DragItem = {
 id: string;
 type: "view" | "group";
 sourceGroupId?: string;
 data?: any;
};

export type DropZone = {
 groupId: string;
 position: number;
 type: "view" | "group";
};

// Store state type
export interface ViewsFilterState {
 // Core data
 groups: IGroupViewFilter[];
 activeGroupId: string | null;
 activeViewId: string | null; // Added this field
 overActiveId: string | null;
 lastAction: string | null;
 activeItem: any;
 setActiveItem: (item: any) => void;
 setIsDragging: (isDragging: boolean) => void;
 isDragging: boolean;

 // Drag and drop state
 dragItem: DragItem | null;
 dragPreview: {
  groupId: string;
  position: number;
  type: "view" | "group";
 } | null;
 isValidDropZone: boolean;

 // Active state actions
 setActiveGroupId: (groupId: string | null) => void;
 setActiveViewId: (viewId: string | null) => void;
 setActiveIds: (groupId: string | null, viewId: string | null) => void;
 setOverActiveId: (id: string | null) => void;

 // Actions
 setGroups: (groups: IGroupViewFilter[]) => void;
 addGroup: (group: Omit<IGroupViewFilter, "groupId">) => void;
 removeGroup: (groupId: string) => void;
 updateGroup: (groupId: string, updates: Partial<IGroupViewFilter>) => void;

 // View operations
 addView: (
  groupId: string,
  view: Omit<ISharedViewFilter, "id" | "groupId">
 ) => void;
 removeView: (groupId: string, viewId: string) => void;
 updateView: (
  groupId: string,
  viewId: string,
  updates: Partial<ISharedViewFilter>
 ) => void;

 // Drag and drop operations
 startDrag: (item: DragItem) => void;
 endDrag: () => void;
 setDragPreview: (
  preview: { groupId: string; position: number; type: "view" | "group" } | null
 ) => void;
 setValidDropZone: (isValid: boolean) => void;
 moveView: (
  viewId: string,
  sourceGroupId: string,
  targetGroupId: string,
  position: number
 ) => void;
 moveGroupViews: (
  sourceGroupId: string,
  targetGroupId: string,
  position: number
 ) => void;
 reorderGroups: (sourceGroupId: string, targetIndex: number) => void;
 createGroupWithView: (view: ISharedViewFilter, position: number) => void;

 // Utility operations
 reset: (groups?: IGroupViewFilter[]) => void;

 // Selectors
 getGroupById: (groupId: string) => IGroupViewFilter | undefined;
 getViewById: (
  viewId: string
 ) => { view: ISharedViewFilter; groupId: string } | null;
 getEnabledGroups: () => IGroupViewFilter[];
 getDisabledGroups: () => IGroupViewFilter[];
 getGroupsCount: () => number;
 getTotalViewsCount: () => number;
}

// Utility functions
const generateId = () =>
 `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const findViewInGroups = (groups: IGroupViewFilter[], viewId: string) => {
 for (const group of groups) {
  const view = group.views.find((v) => v.id === viewId);
  if (view) return { view, groupId: group.groupId };
 }
 return null;
};

const findGroupById = (groups: IGroupViewFilter[], groupId: string) => {
 return groups.find((g) => g.groupId === groupId);
};
const initialContextData = [
 {
  groupId: "group-1",
  title: "AND CONDITIONS",
  status: "enabled",
  type: "AND",
  views: [
   {
    id: "view-1",
    columnId: "Column A",
    groupId: "group-1",
    values: null,
    subField: null,
   },
   {
    id: "view-2",
    columnId: "Column B",
    groupId: "group-1",
    values: null,
    subField: null,
   },
  ],
 },
 {
  groupId: "group-2",
  title: "OR CONDITIONS",
  status: "enabled",
  type: "OR",
  views: [
   {
    id: "view-3",
    columnId: "Column C",
    groupId: "group-2",
    values: null,
    subField: null,
   },
   {
    id: "view-4",
    columnId: "Column D",
    groupId: "group-2",
    values: null,
    subField: null,
   },
  ],
 },
 {
  groupId: "group-3",
  title: "FILTER CONDITIONS",
  status: "enabled",
  type: "FILTER",
  views: [
   {
    id: "view-5",
    columnId: "Column E",
    groupId: "group-3",
    values: null,
    subField: null,
   },
   {
    id: "view-6",
    columnId: "Column F",
    groupId: "group-3",
    values: null,
    subField: null,
   },
   {
    id: "view-7",
    columnId: "Column G",
    groupId: "group-3",
    values: null,
    subField: null,
   },
  ],
 },
 {
  groupId: "group-4",
  title: "FILTER CONDITIONS",
  status: "enabled",
  type: "FILTER",
  views: [
   {
    id: "view-8",
    columnId: "Column Y",
    groupId: "group-4",
    values: null,
    subField: null,
   },
   {
    id: "view-9",
    columnId: "Column K",
    groupId: "group-4",
    values: null,
    subField: null,
   },
   {
    id: "view-10",
    columnId: "Column L",
    groupId: "group-4",
    values: null,
    subField: null,
   },
   {
    id: "view-11",
    columnId: "Column M",
    groupId: "group-4",
    values: null,
    subField: null,
   },
  ],
 },
] as IGroupViewFilter[];
// Create the store
export const useViewsFilterStore = create<ViewsFilterState>()(
 subscribeWithSelector(
  immer((set, get) => ({
   // Initial state
   groups: initialContextData,
   activeGroupId: null,
   activeViewId: null,
   overActiveId: null,
   lastAction: null,
   dragItem: null,
   dragPreview: null,
   isValidDropZone: false,
   activeItem: null,
   isDragging: false,

   // Active state actions
   setActiveGroupId: (groupId) =>
    set((state) => {
     state.activeGroupId = groupId;
     // Clear active view if switching groups
     if (groupId !== state.activeGroupId) {
      state.activeViewId = null;
     }
    }),

   setActiveViewId: (viewId) =>
    set((state) => {
     state.activeViewId = viewId;
     // Set active group based on view
     if (viewId) {
      const viewData = findViewInGroups(state.groups, viewId);
      if (viewData) {
       state.activeGroupId = viewData.groupId;
      }
     }
    }),

   setActiveItem: (item) =>
    set((state) => {
     state.activeItem = item;
    }),

   setActiveIds: (groupId, viewId) =>
    set((state) => {
     state.activeGroupId = groupId;
     state.activeViewId = viewId;
    }),
   setOverActiveId: (id) =>
    set((state) => {
     state.overActiveId = id;
    }),

   setIsDragging: (item) =>
    set((state) => {
     state.isDragging = item;
    }),

   // Basic CRUD operations
   setGroups: (groups) =>
    set((state) => {
     state.groups = groups;
     state.lastAction = "SET_GROUPS";
     // Clear active IDs if they no longer exist
     if (state.activeGroupId && !findGroupById(groups, state.activeGroupId)) {
      state.activeGroupId = null;
     }
     if (state.activeViewId && !findViewInGroups(groups, state.activeViewId)) {
      state.activeViewId = null;
     }
    }),

   addGroup: (group) =>
    set((state) => {
     const newGroup: IGroupViewFilter = {
      ...group,
      groupId: generateId(),
     };
     state.groups.push(newGroup);
     state.lastAction = "ADD_GROUP";
     // Optionally set as active
     state.activeGroupId = newGroup.groupId;
    }),

   removeGroup: (groupId) =>
    set((state) => {
     state.groups = state.groups.filter((g) => g.groupId !== groupId);
     // Clear active IDs if removing active group
     if (state.activeGroupId === groupId) {
      state.activeGroupId = null;
      state.activeViewId = null;
     }
     state.lastAction = "REMOVE_GROUP";
    }),

   updateGroup: (groupId, updates) =>
    set((state) => {
     const group = state.groups.find((g) => g.groupId === groupId);
     if (group) {
      Object.assign(group, updates);
      state.lastAction = "UPDATE_GROUP";
     }
    }),

   // View operations
   addView: (groupId, view) =>
    set((state) => {
     const group = state.groups.find((g) => g.groupId === groupId);
     if (group) {
      const newView: ISharedViewFilter = {
       ...view,
       id: generateId(),
       groupId,
      };
      group.views.push(newView);
      state.lastAction = "ADD_VIEW";
      // Optionally set as active
      state.activeGroupId = groupId;
      state.activeViewId = newView.id;
     }
    }),

   removeView: (groupId, viewId) =>
    set((state) => {
     const group = state.groups.find((g) => g.groupId === groupId);
     if (group) {
      group.views = group.views.filter((v) => v.id !== viewId);

      // Clear active view if removing it
      if (state.activeViewId === viewId) {
       state.activeViewId = null;
      }

      // Remove empty groups
      if (group.views.length === 0) {
       state.groups = state.groups.filter((g) => g.groupId !== groupId);
       // Clear active group if removing it
       if (state.activeGroupId === groupId) {
        state.activeGroupId = null;
       }
      }
      state.lastAction = "REMOVE_VIEW";
     }
    }),

   updateView: (groupId, viewId, updates) =>
    set((state) => {
     const group = state.groups.find((g) => g.groupId === groupId);
     if (group) {
      const view = group.views.find((v) => v.id === viewId);
      if (view) {
       Object.assign(view, updates);
       state.lastAction = "UPDATE_VIEW";
       // Keep it active if it was being edited
       state.activeViewId = viewId;
       state.activeGroupId = groupId;
      }
     }
    }),

   // Drag and drop operations
   startDrag: (item) =>
    set((state) => {
     state.dragItem = item;
     state.dragPreview = null;
     state.isValidDropZone = false;
    }),

   endDrag: () =>
    set((state) => {
     state.dragItem = null;
     state.dragPreview = null;
     state.isValidDropZone = false;
    }),

   setDragPreview: (preview) =>
    set((state) => {
     state.dragPreview = preview;
    }),

   setValidDropZone: (isValid) =>
    set((state) => {
     state.isValidDropZone = isValid;
    }),

   moveView: (viewId, sourceGroupId, targetGroupId, position) =>
    set((state) => {
     const sourceGroup = state.groups.find((g) => g.groupId === sourceGroupId);
     const targetGroup = state.groups.find((g) => g.groupId === targetGroupId);

     if (sourceGroup && targetGroup) {
      const viewIndex = sourceGroup.views.findIndex((v) => v.id === viewId);
      if (viewIndex !== -1) {
       const [viewToMove] = sourceGroup.views.splice(viewIndex, 1);
       viewToMove.groupId = targetGroupId;

       // Insert at position
       targetGroup.views.splice(position, 0, viewToMove);

       // Update active group if moving active view
       if (state.activeViewId === viewId) {
        state.activeGroupId = targetGroupId;
       }

       // Remove empty groups
       if (sourceGroup.views.length === 0) {
        state.groups = state.groups.filter((g) => g.groupId !== sourceGroupId);
        // Clear active group if removing it
        if (state.activeGroupId === sourceGroupId) {
         state.activeGroupId = targetGroupId;
        }
       }

       state.lastAction = "MOVE_VIEW";
      }
     }
    }),

   moveGroupViews: (sourceGroupId, targetGroupId, position) =>
    set((state) => {
     const sourceIndex = state.groups.findIndex(
      (g) => g.groupId === sourceGroupId
     );
     const targetIndex = state.groups.findIndex(
      (g) => g.groupId === targetGroupId
     );

     if (
      sourceIndex !== -1 &&
      targetIndex !== -1 &&
      sourceIndex !== targetIndex
     ) {
      const sourceGroup = state.groups[sourceIndex];
      const targetGroup = state.groups[targetIndex];

      // Update active group if moving from active group
      if (state.activeGroupId === sourceGroupId) {
       state.activeGroupId = targetGroupId;
      }

      // Move all views from source to target with updated groupId
      const updatedViews = sourceGroup.views.map((view) => ({
       ...view,
       groupId: targetGroupId,
      }));

      // Insert at specific position
      const actualPosition =
       position >= 0 ? position : targetGroup.views.length;
      targetGroup.views.splice(actualPosition, 0, ...updatedViews);

      // Remove source group
      state.groups.splice(sourceIndex, 1);

      state.lastAction = "MOVE_GROUP_VIEWS";
     }
    }),

   reorderGroups: (sourceGroupId, targetIndex) =>
    set((state) => {
     const sourceIndex = state.groups.findIndex(
      (g) => g.groupId === sourceGroupId
     );

     if (sourceIndex !== -1) {
      const [movedGroup] = state.groups.splice(sourceIndex, 1);
      const actualTargetIndex =
       targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
      state.groups.splice(actualTargetIndex, 0, movedGroup);

      state.lastAction = "REORDER_GROUPS";
     }
    }),

   createGroupWithView: (view, position) =>
    set((state) => {
     const newGroupId = generateId();

     // Remove view from source group
     for (const group of state.groups) {
      const viewIndex = group.views.findIndex((v) => v.id === view.id);
      if (viewIndex !== -1) {
       group.views.splice(viewIndex, 1);
       break;
      }
     }

     // Create new group
     const newGroup: IGroupViewFilter = {
      groupId: newGroupId,
      title: "NEW CONDITIONS",
      status: "enabled",
      type: "AND",
      views: [{ ...view, groupId: newGroupId }],
     };

     // Insert at position
     state.groups.splice(position, 0, newGroup);

     // Remove empty groups
     state.groups = state.groups.filter((group) => group.views.length > 0);

     // Set as active
     state.activeGroupId = newGroupId;
     state.activeViewId = view.id;

     state.lastAction = "CREATE_GROUP_WITH_VIEW";
    }),

   reset: (groups = []) =>
    set((state) => {
     state.groups = groups;
     state.activeGroupId = null;
     state.activeViewId = null; // Added this
     state.lastAction = null;
     state.dragItem = null;
     state.dragPreview = null;
     state.isValidDropZone = false;
    }),

   // Selectors
   getGroupById: (groupId) => {
    const { groups } = get();
    return findGroupById(groups, groupId);
   },

   getViewById: (viewId) => {
    const { groups } = get();
    return findViewInGroups(groups, viewId);
   },

   getGroupsCount: () => {
    const { groups } = get();
    return groups.length;
   },

   getTotalViewsCount: () => {
    const { groups } = get();
    return groups.reduce((acc, group) => acc + group.views.length, 0);
   },

   getEnabledGroups: () => {
    const { groups } = get();
    return groups.filter((g) => g.status === "enabled");
   },

   getDisabledGroups: () => {
    const { groups } = get();
    return groups.filter((g) => g.status === "disabled");
   },
  }))
 )
);

// Utility function to convert to app format
export const convertToAppFormat = (groups: IGroupViewFilter[]) => {
 return groups.map((group) => ({
  groupId: group.groupId,
  title: group.title || "CONDITIONS",
  enabled: group.status === "enabled",
  views: group.views.map((view) => ({
   id: view.id,
   columnId: view.columnId,
   groupId: view.groupId,
  })),
 }));
};

// Export helper functions
export { generateId, findViewInGroups, findGroupById };

export const ViewsFilterContext = createContext<ViewsFilterState | null>(null);

export const ViewsFilterProvider = ({ children, initialGroups = [] }) => {
 const store = useViewsFilterStore();

 useEffect(() => {
  if (initialGroups.length > 0) {
   store.setGroups(initialGroups);
  }
 }, [initialGroups, store]);

 return (
  <ViewsFilterContext.Provider value={store}>
   {children}
  </ViewsFilterContext.Provider>
 );
};

// Custom hook for easier access
export const useViewsFilter = () => {
 const context = useContext(ViewsFilterContext);
 if (!context) {
  throw new Error("useViewsFilter must be used within ViewsFilterProvider");
 }
 return context;
};
