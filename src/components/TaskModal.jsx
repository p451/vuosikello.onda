import React from 'react';

const TaskModal = ({
  open,
  onClose,
  onSubmit,
  task,
  setTask,
  events = [],
  loading = false,
  title = 'Lisää uusi tehtävä',
  categoryLabel = 'Kategoria',
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-lowlightBg/80 flex items-center justify-center p-4 z-50 dark:bg-darkLowlightBg/80">
      <div className="bg-surface/90 p-6 rounded-lg w-full max-w-md shadow-modal border border-border backdrop-blur-sm dark:bg-darkSurface/90 dark:border-darkBorder">
        <h3 className="modal-header text-lg font-semibold mb-4 dark:text-darkTextPrimary">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">Nimi</label>
            <input
              type="text"
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.title}
              onChange={e => setTask({ ...task, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">Kuvaus</label>
            <textarea
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.description}
              onChange={e => setTask({ ...task, description: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">Deadline</label>
            <input
              type="date"
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.deadline}
              onChange={e => setTask({ ...task, deadline: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">Prioriteetti</label>
            <select
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.priority}
              onChange={e => setTask({ ...task, priority: e.target.value })}
            >
              <option value="low">Matala</option>
              <option value="medium">Keskitaso</option>
              <option value="high">Korkea</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">{categoryLabel || 'Kategoria'}</label>
            <input
              type="text"
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.category}
              onChange={e => setTask({ ...task, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium dark:text-darkTextPrimary">Liitä tapahtumaan</label>
            <select
              className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
              value={task.event_id || ''}
              onChange={e => {
                const val = e.target.value;
                setTask({ ...task, event_id: val === '' ? null : Number(val) });
              }}
            >
              <option value="">Ei liitetty tapahtumaan</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({new Date(event.startDate || event.start_date).toLocaleDateString('fi-FI')})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface text-textPrimary font-sans font-medium shadow-card hover:bg-highlight transition-all duration-200 ease-in-out border border-secondary dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkSecondary dark:hover:bg-darkHighlight"
              onClick={onClose}
              disabled={loading}
            >
              Peruuta
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white font-sans font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
              disabled={loading}
            >
              {loading ? 'Tallennetaan...' : 'Lisää tehtävä'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
