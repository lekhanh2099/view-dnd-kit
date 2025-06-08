// Types
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

export function rebuildGroupsWithFake(groups: Group[]): Group[] {
 const realGroups = groups.filter((g) => !g.isFakeGroup);

 const newGroups: Group[] = [];

 realGroups.forEach((group, index) => {
  newGroups.push({ ...group, isFakeGroup: false });

  if (index < realGroups.length - 1) {
   newGroups.push(createFakeGroup(index * 2 + 1));
  }
 });

 return newGroups.map((group, index) => ({ ...group, groupIdx: index }));
}
