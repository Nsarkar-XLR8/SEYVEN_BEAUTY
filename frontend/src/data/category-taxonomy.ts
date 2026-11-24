export interface DynamicCategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn?: string;
  parentId?: string | null;
  children?: DynamicCategoryNode[];
}

export type CategoryNode = DynamicCategoryNode;

/**
 * Formats all-caps or slugged category names into elegant Title Case (e.g. "CLEANSER" -> "Cleanser")
 */
export function formatCategoryTitle(name: string): string {
  if (!name) return '';
  if (name !== name.toUpperCase() && name !== name.toLowerCase()) {
    return name;
  }
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Builds a 100% Dynamic 3-Level Category Tree from database categories.
 * Supports arbitrary depth: Level 1 (Department) -> Level 2 (Subcategory) -> Level 3 (Micro-Type).
 * If the API returns flat categories or nested categories, this seamlessly resolves both!
 */
export function buildDynamicCategoryHierarchy(
  dbCategories: Array<any> = [],
): DynamicCategoryNode[] {
  if (!Array.isArray(dbCategories) || dbCategories.length === 0) {
    return [];
  }

  // 1. Check if backend already returned a nested tree (roots have .children)
  const isPreNested = dbCategories.some((c) => c && Array.isArray(c.children) && c.children.length > 0);

  // Priority order for Level 1 Root Departments: Skin Care -> Hair Care -> Body Care -> Makeup -> then Alphabetical for remainder
  const ROOT_DEPARTMENT_PRIORITY = [
    'skin care',
    'skincare',
    'hair care',
    'haircare',
    'body care',
    'bodycare',
    'makeup',
    'make up',
  ];

  const getPriorityIndex = (name: string): number => {
    const clean = (name || '').toLowerCase().trim();
    const idx = ROOT_DEPARTMENT_PRIORITY.findIndex((p) => p === clean || clean.startsWith(p));
    return idx === -1 ? 999 : idx;
  };

  // Helper to sort root departments by priority then alphabetical, and all sub-levels alphabetically
  const sortHierarchyTree = (nodes: DynamicCategoryNode[], isRootLevel = true): DynamicCategoryNode[] => {
    return nodes
      .sort((a, b) => {
        if (isRootLevel) {
          const pA = getPriorityIndex(a.nameEn);
          const pB = getPriorityIndex(b.nameEn);
          if (pA !== pB) return pA - pB;
        }
        return (a.nameEn || '').localeCompare(b.nameEn || '', undefined, { sensitivity: 'base' });
      })
      .map((node) => ({
        ...node,
        children: node.children && node.children.length > 0 ? sortHierarchyTree(node.children, false) : undefined,
      }));
  };

  if (isPreNested) {
    const mapNode = (node: any): DynamicCategoryNode => ({
      id: node.id || node.slug,
      slug: (node.slug || node.id || '').toLowerCase(),
      nameEn: node.nameEn || node.slug,
      nameBn: node.nameBn,
      parentId: node.parentId || null,
      children: Array.isArray(node.children) && node.children.length > 0
        ? node.children.map(mapNode)
        : undefined,
    });

    const roots = dbCategories
      .filter((c) => c && (!c.parentId || c.parentId === 'null'))
      .map(mapNode);

    return sortHierarchyTree(roots, true);
  }

  // 2. If backend returned flat list, assemble the tree recursively using parentId
  const nodeMap = new Map<string, DynamicCategoryNode & { children: DynamicCategoryNode[] }>();
  
  dbCategories.forEach((c) => {
    if (!c) return;
    const id = c.id || c.slug;
    nodeMap.set(id, {
      id,
      slug: (c.slug || id).toLowerCase(),
      nameEn: c.nameEn || c.slug,
      nameBn: c.nameBn,
      parentId: c.parentId || null,
      children: [],
    });
  });

  const roots: DynamicCategoryNode[] = [];

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Clean up empty children arrays and sort alphabetically
  const finalizeNode = (n: DynamicCategoryNode & { children: DynamicCategoryNode[] }): DynamicCategoryNode => ({
    id: n.id,
    slug: n.slug,
    nameEn: n.nameEn,
    nameBn: n.nameBn,
    parentId: n.parentId,
    children: n.children.length > 0 ? n.children.map((c) => finalizeNode(c as any)) : undefined,
  });

  return sortHierarchyTree(roots.map((r) => finalizeNode(r as any)), true);
}

/**
 * Collects all descendant slugs from a category node (including itself, children, grandchildren).
 * Used for smart recursive catalog rollup filtering.
 */
export function getAllDescendantSlugs(
  targetSlugOrId: string,
  categories: DynamicCategoryNode[],
): string[] {
  const result: string[] = [];
  const targetLower = targetSlugOrId.toLowerCase().trim();

  function findAndCollect(nodes: DynamicCategoryNode[]): boolean {
    for (const node of nodes) {
      if (node.slug.toLowerCase() === targetLower || node.id.toLowerCase() === targetLower) {
        collectAll(node);
        return true;
      }
      if (node.children && findAndCollect(node.children)) {
        return true;
      }
    }
    return false;
  }

  function collectAll(node: DynamicCategoryNode) {
    result.push(node.slug.toLowerCase());
    result.push(node.nameEn.toLowerCase());
    if (node.children) {
      node.children.forEach(collectAll);
    }
  }

  findAndCollect(categories);
  return result;
}
