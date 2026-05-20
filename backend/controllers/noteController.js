import Note from '../models/Note.js';

// @desc    Get notes for user/project
// @route   GET /api/notes/:projectId
// @access  Private
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ 
      userId: req.user._id, 
      projectId: req.params.projectId 
    }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { projectId, content, color, positionX, positionY, width, height, rotation } = req.body;
    
    const note = new Note({
      userId: req.user._id,
      projectId,
      content,
      color: color ?? 'yellow',
      positionX: positionX ?? 50,
      positionY: positionY ?? 50,
      width: width ?? 200,
      height: height ?? 150,
      rotation: rotation ?? 0
    });

    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (note) {
      note.content = req.body.content ?? note.content;
      note.color = req.body.color ?? note.color;
      note.positionX = req.body.positionX ?? note.positionX;
      note.positionY = req.body.positionY ?? note.positionY;
      note.width = req.body.width ?? note.width;
      note.height = req.body.height ?? note.height;
      note.zIndex = req.body.zIndex ?? note.zIndex;
      note.rotation = req.body.rotation ?? note.rotation;

      const updatedNote = await note.save();
      res.json(updatedNote);
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (note) {
      res.json({ message: 'Note removed' });
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getNotes, createNote, updateNote, deleteNote };

