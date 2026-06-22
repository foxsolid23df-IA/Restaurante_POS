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
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
