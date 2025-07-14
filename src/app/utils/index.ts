export interface View {
 id: string;
 columnId: string;
 groupId: string;
 operator: string;
 value: string;
 columnType: string;
 enabled: boolean;
}

export interface FakeView {
 id: string;
 groupId: string;
 isFakeView: true;
 insertIndex: number;
}

export interface Group {
 groupId: string;
 groupIdx: number;
 title?: string;
 views: View[];
 enabled: boolean;
 isFakeGroup: boolean;
}

export interface FakeGroup {
 id: string;
 insertIndex: number;
}

export interface DragData {
 type: string;
 view?: View;
 group?: Group;
 fakeView?: FakeView;
 fakeGroup?: { type: "fake_group"; fakeGroup: FakeGroup };
}

export interface ActiveItem {
 type: string;
 item: {
  view?: View;
  group?: Group;
 };
}
export interface FakeViewDropZoneProps {
 fakeView: FakeView;
 isActive: boolean;
 activeItem?: ActiveItem;
}

export interface DraggableViewProps {
 view: View;
 isDraggedOver?: boolean;
 activeItem?: ActiveItem;
 dragOverId?: string | null;
 activeId?: string | null;
 viewIndex?: number;
 activeViewIndex?: number;
 isDropTarget?: boolean;
}

export interface DraggableGroupProps {
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

export const DRAG_TYPES = {
 VIEW: "view",
 GROUP: "group",
 NEW_GROUP_ZONE: "new-group-zone",
 GROUP_MERGE_ZONE: "group_merge_zone",
 FAKE_VIEW: "fake-view",
 FAKE_GROUP: "fake-group",
} as const;

export const generateId = (): string => {
 return Math.random().toString(36).substr(2, 9);
};

export const createFakeGroup = (groupIdx: number): Group => ({
 groupId: generateId(),
 groupIdx,
 views: [],
 isFakeGroup: true,
 enabled: true,
});

export const createFakeView = (
 groupId: string,
 insertIndex: number
): FakeView => ({
 id: `fake-view-${groupId}-${insertIndex}`,
 groupId,
 isFakeView: true,
 insertIndex,
});

export const createGroupMergeZone = (groupId, insertIndex) => ({
 id: `group-merge-${groupId}-${insertIndex}`,
 groupId,
 insertIndex,
 isGroupMergeZone: true,
});

export const getMockData = (): Group[] => [
 createFakeGroup(0),
 {
  groupId: "group-id-1",
  groupIdx: 0,
  title: "AND CONDITIONS",
  enabled: true,
  views: [
   {
    columnId: "Column-views-1",
    id: "Column-views-id-1",
    operator: "is",
    value: "Vietnamese",
    columnType: "Vietnamese",
    groupId: "group-id-1",
    enabled: true,
   },
   {
    columnId: "Column-views-2",
    id: "Column-views-id-2",
    operator: "contains",
    value: "test",
    columnType: "English (United States)",
    groupId: "group-id-1",
    enabled: true,
   },
  ],
  isFakeGroup: false,
 },

 createFakeGroup(2),
 {
  groupId: "group-id-2",
  groupIdx: 1,
  title: "OR CONDITIONS",
  enabled: true,
  views: [
   {
    columnId: "Other_Column_1",
    groupId: "group-id-2",
    id: "6ippfy765nq5p",
    operator: "is not",
    value: "example",
    columnType: "Other",
    enabled: true,
   },
   {
    columnId: "Other_Column_2",
    groupId: "group-id-2",
    id: "this_is_a_test",
    operator: "is not",
    value: "example",
    columnType: "Other",
    enabled: true,
   },
  ],
  isFakeGroup: false,
 },
 createFakeGroup(3),
];

export function rebuildGroupsWithFake(groups: Group[]): Group[] {
 const realGroups = groups.filter((g) => !g.isFakeGroup);
 const newGroups: Group[] = [];

 newGroups.push(createFakeGroup(0));

 realGroups.forEach((group, index) => {
  newGroups.push({ ...group, isFakeGroup: false });
  newGroups.push(createFakeGroup((index + 1) * 2));
 });

 return newGroups.map((group, index) => ({ ...group, groupIdx: index }));
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
 const newArray = [...array];
 const item = newArray.splice(from, 1)[0];
 newArray.splice(to, 0, item);
 return newArray;
}
