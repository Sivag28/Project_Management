import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchNotes, createNote, updateNote, deleteNote, setCurrentProjectId } from '../redux/noteSlice';
import { FaTrash } from 'react-icons/fa';

const COLORS = {
  yellow: '#fef9c3',
  orange: '#fed7aa',
  pink: '#f9a8d4',
  purple: '#e9d5ff',
  green: '#d4edda',
  blue: '#cce7ff'
};

const COLOR_NAMES = Object.keys(COLORS);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const COMPOSER_SAFE_ZONE = {
  maxX: 38,
  minY: 56
};

const keepNoteVisible = (positionX, positionY) => {
  let safeX = clamp(positionX, 0, 78);
  let safeY = clamp(positionY, 0, 72);

  const hidesBehindComposer = safeX <= COMPOSER_SAFE_ZONE.maxX && safeY >= COMPOSER_SAFE_ZONE.minY;
  if (hidesBehindComposer) {
    safeX = 44;
    safeY = 12;
  }

  return { x: safeX, y: safeY };
};

const StickyNote = ({ note, onEdit, onDelete }) => {
  const [localContent, setLocalContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: note._id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : note.zIndex || 1,
    left: `${note.positionX}%`,
    top: `${note.positionY}%`,
    width: `${note.width}px`,
    height: `${note.height}px`,
    backgroundColor: COLORS[note.color],
    rotate: `${note.rotation || 0}deg`
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setLocalContent(e.target.value);
      onEdit(note._id, { ...note, content: e.target.value });
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`sticky-note-card group absolute cursor-grab overflow-hidden rounded-lg border border-black/20 p-3 shadow-lg transition-all duration-200 hover:scale-[1.02] active:cursor-grabbing active:scale-[0.98]
        before:absolute before:-inset-1 before:rounded-lg before:bg-gradient-to-r before:from-black/5 before:to-transparent before:content-['']
        after:absolute after:right-0 after:top-0 after:h-4 after:w-4 after:-translate-x-1 after:-translate-y-1 after:rotate-45 after:rounded-bl after:bg-white/80 after:content-['']`}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => {
            onEdit(note._id, { ...note, content: localContent });
            setIsEditing(false);
          }}
          onKeyDown={handleKeyDown}
          className="h-full w-full resize-none border-none bg-transparent p-1 text-sm outline-none font-handwritten"
          maxLength={500}
          autoFocus
        />
      ) : (
        <div className="h-full w-full select-text overflow-hidden whitespace-pre-wrap text-sm leading-tight text-black font-handwritten">
          {localContent}
        </div>
      )}

      <div className="absolute right-1 top-1 flex gap-1 rounded-full bg-white/90 p-1 opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note._id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-xs text-white transition-all hover:scale-110 hover:bg-red-500"
          title="Delete note"
        >
          <FaTrash />
        </button>
      </div>

      <div
        className="absolute bottom-1 left-1 h-3 w-3 rounded-full border border-white/50"
        style={{ backgroundColor: COLORS[note.color] }}
      />
    </div>
  );
};

const StickyNoteBoard = ({ projectId }) => {
  const dispatch = useDispatch();
  const projects = useSelector((state) => state.projects.projects);
  const { notes, loading, error, currentProjectId } = useSelector((state) => state.notes);

  const [selectedColor, setSelectedColor] = useState('yellow');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [nextPosition, setNextPosition] = useState({ x: 44, y: 12 });
  const boardRef = useRef(null);
  const effectiveProjectId = projectId || currentProjectId || '';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  useEffect(() => {
    if (projectId) {
      dispatch(setCurrentProjectId(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!projectId && !currentProjectId && projects?.length > 0) {
      dispatch(setCurrentProjectId(projects[0]._id));
    }
  }, [dispatch, projectId, currentProjectId, projects]);

  useEffect(() => {
    if (effectiveProjectId) {
      dispatch(fetchNotes({ projectId: effectiveProjectId }));
    }
  }, [dispatch, effectiveProjectId]);

  const handleCreateNote = () => {
    if (!newNoteContent.trim() || !effectiveProjectId) return;
    const safePosition = keepNoteVisible(nextPosition.x, nextPosition.y);

    dispatch(createNote({
      projectId: effectiveProjectId,
      content: newNoteContent,
      color: selectedColor,
      positionX: safePosition.x,
      positionY: safePosition.y,
      zIndex: notes.length + 1
    })).then(() => {
      setNewNoteContent('');
      setNextPosition((prev) => ({
        x: prev.x >= 68 ? 44 : prev.x + 8,
        y: prev.y >= 36 ? 12 : prev.y + 6
      }));
    });
  };

  const handleUpdateNote = (id, updatedData) => {
    dispatch(updateNote({ id, noteData: updatedData }));
  };

  const handleDeleteNote = (id) => {
    dispatch(deleteNote(id));
  };

  const handleDragEnd = (event) => {
    const { active, delta } = event;
    const draggedNote = notes.find((note) => note._id === active.id);

    if (draggedNote && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = (delta.x / rect.width) * 100 + draggedNote.positionX;
      const y = (delta.y / rect.height) * 100 + draggedNote.positionY;

      handleUpdateNote(active.id, {
        ...draggedNote,
        positionX: clamp(x, 0, 95),
        positionY: clamp(y, 0, 90),
        zIndex: notes.length + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="sticky-note-board relative min-h-[600px] overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50/60 via-orange-50/60 to-yellow-100/60 p-8">

      <div
        ref={boardRef}
        className="sticky-note-canvas absolute inset-0 z-0 cursor-grab select-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRkZBQjgwIi8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjIiIGZpbGw9IiNENjlEMUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgdHJhbnNmb3JtPSJyb3RhdGUoNDUgMjAgMjApIiBmaWxsPSIjRDY5RDFCIi8+CjxjaXJjbGUgY3g9IjQ0IiBjeT0iNDQiIHI9IjEiIHRyYW5zZm9ybT0icm90YXRlKDQ1IDQ0IDQ0KSIgZmlsbD0iI0Q2OUQxQiIvPgo8L3N2Zz4K')] bg-repeat"
      />

      <div className="sticky-note-list absolute inset-0 z-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={notes.map((n) => n._id)} strategy={rectSortingStrategy}>
            {notes.map((note) => (
              <StickyNote
                key={note._id}
                note={note}
                onEdit={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="sticky-note-composer absolute bottom-8 left-8 z-50 w-[360px] rounded-3xl border border-white/60 bg-white/95 p-6">

        <div className="mb-4 border-b border-amber-100 pb-3">
          <h3 className="text-lg font-semibold tracking-tight text-amber-950">
            Quick Sticky Note
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            Add a short idea or reminder for the selected project.
          </p>
        </div>

        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Jot down your quick idea... (double-click notes to edit)"
          className="min-h-[92px] w-full resize-none rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-950 placeholder:text-amber-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
          maxLength={500}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-amber-100 p-1.5">
            {COLOR_NAMES.map((color) => (
              <button
                key={color}
                className={`h-8 w-8 rounded-lg border-2 transition-all ${
                  selectedColor === color
                    ? 'scale-105 border-amber-500'
                    : 'border-transparent hover:border-amber-400'
                }`}
                style={{ backgroundColor: COLORS[color] }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          <button
            onClick={handleCreateNote}
            disabled={!newNoteContent.trim() || !effectiveProjectId}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Note
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
          <span className="font-semibold text-amber-900">Pro tip:</span>{' '}
          Drag notes around, double-click to edit, and use delete when needed.
        </div>

        {notes.length > 0 && (
          <div className="mt-3 text-right text-xs font-medium text-amber-700">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} | Last sync: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

        {projects?.length > 0 && (
          <div className="sticky-project-picker absolute top-8 right-8 z-40 rounded-2xl border border-white/50 bg-white/95 p-5">
            <select
            value={effectiveProjectId}
            onChange={(e) => {
              const newProjectId = e.target.value;
              dispatch(setCurrentProjectId(newProjectId));
            }}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Select Project...</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
          </div>
        )}
    </div>
  );
};

export default StickyNoteBoard;
