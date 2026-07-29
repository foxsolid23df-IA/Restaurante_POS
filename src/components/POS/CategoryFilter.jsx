export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`shrink-0 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
          selectedCategory === 'all'
            ? 'bg-primary text-white border-primary'
            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={`shrink-0 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
            selectedCategory === category.id
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
