import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Flag, 
  Calendar, 
  Tag, 
  Users,
  Filter,
  Clock,
  ChevronDown
} from 'lucide-react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  category: string;
  assignedTo: string[];
  recurring: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | null;
    nextDue: string | null;
  };
}

interface Filter {
  priority: string[];
  categories: string[];
  completed: boolean | null;
  dueDate: 'today' | 'week' | 'all' | null;
  assignedTo: string[];
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [quickEntry, setQuickEntry] = useState(false);
  const [categories] = useState<string[]>(['Personal', 'Work', 'Shopping', 'Health']);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    priority: [],
    categories: [],
    completed: null,
    dueDate: null,
    assignedTo: [],
  });
  const [collaborators] = useState(['Me', 'John', 'Sarah', 'Mike']);
  const [newTaskData, setNewTaskData] = useState({
    priority: 'medium' as const,
    dueDate: '',
    category: 'Personal',
    assignedTo: ['Me'],
    recurring: {
      isRecurring: false,
      frequency: null as 'daily' | 'weekly' | 'monthly' | null,
      nextDue: null,
    },
  });

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      todos.forEach(todo => {
        if (todo.dueDate && !todo.completed) {
          const dueDate = new Date(todo.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          if (hoursDiff <= 24 && hoursDiff > 0) {
            new Notification('Task Due Soon', {
              body: `"${todo.text}" is due in ${Math.round(hoursDiff)} hours`,
            });
          }
        }
      });
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkDueReminders, 3600000);
    return () => clearInterval(interval);
  }, [todos]);

  useEffect(() => {
    const updateRecurringTasks = () => {
      const updatedTodos = todos.map(todo => {
        if (todo.recurring.isRecurring && todo.recurring.nextDue) {
          const nextDue = new Date(todo.recurring.nextDue);
          const now = new Date();

          if (nextDue <= now) {
            let newNextDue = new Date(nextDue);
            switch (todo.recurring.frequency) {
              case 'daily':
                newNextDue.setDate(newNextDue.getDate() + 1);
                break;
              case 'weekly':
                newNextDue.setDate(newNextDue.getDate() + 7);
                break;
              case 'monthly':
                newNextDue.setMonth(newNextDue.getMonth() + 1);
                break;
            }

            return {
              ...todo,
              completed: false,
              recurring: {
                ...todo.recurring,
                nextDue: newNextDue.toISOString().split('T')[0],
              },
            };
          }
        }
        return todo;
      });

      setTodos(updatedTodos);
    };

    const interval = setInterval(updateRecurringTasks, 3600000);
    return () => clearInterval(interval);
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        priority: newTaskData.priority,
        dueDate: newTaskData.dueDate || null,
        category: newTaskData.category,
        assignedTo: newTaskData.assignedTo,
        recurring: {
          ...newTaskData.recurring,
          nextDue: newTaskData.recurring.isRecurring ? newTaskData.dueDate : null,
        },
      };

      setTodos(prevTodos => [...prevTodos, newTodoItem]);
      setNewTodo('');
      
      if (quickEntry) {
        setNewTodo('');
      } else {
        setNewTaskData({
          priority: 'medium',
          dueDate: '',
          category: 'Personal',
          assignedTo: ['Me'],
          recurring: {
            isRecurring: false,
            frequency: null,
            nextDue: null,
          },
        });
      }
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: number) => {
    setTodos(prevTodos => prevTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id: number) => {
    setTodos(prevTodos => prevTodos.map(todo =>
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filters.completed !== null && todo.completed !== filters.completed) return false;
    if (filters.priority.length && !filters.priority.includes(todo.priority)) return false;
    if (filters.categories.length && !filters.categories.includes(todo.category)) return false;
    if (filters.assignedTo.length && !todo.assignedTo.some(user => filters.assignedTo.includes(user))) return false;
    
    if (filters.dueDate) {
      const today = new Date();
      const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
      if (!dueDate) return false;
      
      if (filters.dueDate === 'today') {
        if (dueDate.toDateString() !== today.toDateString()) return false;
      } else if (filters.dueDate === 'week') {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (dueDate > weekFromNow || dueDate < today) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 text-center">Advanced Todo List</h1>
          
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setQuickEntry(!quickEntry)}
              className={`text-sm px-3 py-1 rounded ${
                quickEntry ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Quick Entry Mode
            </button>
          </div>

          <form onSubmit={addTodo} className="mb-6">
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} />
                Add
              </button>
            </div>

            {!quickEntry && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Flag className={getPriorityColor(newTaskData.priority)} size={20} />
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({
                      ...newTaskData,
                      priority: e.target.value as 'low' | 'medium' | 'high'
                    })}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-600" />
                  <input
                    type="date"
                    value={newTaskData.dueDate}
                    onChange={(e) => setNewTaskData({
                      ...newTaskData,
                      dueDate: e.target.value
                    })}
                    className="border border-gray-300 rounded px-2 py-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Tag size={20} className="text-gray-600" />
                  <select
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData({
                      ...newTaskData,
                      category: e.target.value
                    })}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Users size={20} className="text-gray-600" />
                  <select
                    multiple
                    value={newTaskData.assignedTo}
                    onChange={(e) => setNewTaskData({
                      ...newTaskData,
                      assignedTo: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    {collaborators.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-gray-600" />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTaskData.recurring.isRecurring}
                      onChange={(e) => setNewTaskData({
                        ...newTaskData,
                        recurring: {
                          ...newTaskData.recurring,
                          isRecurring: e.target.checked,
                        }
                      })}
                      className="rounded text-purple-600"
                    />
                    Recurring
                  </label>
                  {newTaskData.recurring.isRecurring && (
                    <select
                      value={newTaskData.recurring.frequency || ''}
                      onChange={(e) => setNewTaskData({
                        ...newTaskData,
                        recurring: {
                          ...newTaskData.recurring,
                          frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | null,
                        }
                      })}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  )}
                </div>
              </div>
            )}
          </form>

          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <Filter size={20} />
              Filters
              <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold mb-2">Priority</h3>
                  {['low', 'medium', 'high'].map(priority => (
                    <label key={priority} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={(e) => setFilters({
                          ...filters,
                          priority: e.target.checked
                            ? [...filters.priority, priority]
                            : filters.priority.filter(p => p !== priority)
                        })}
                        className="rounded text-purple-600"
                      />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </label>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Categories</h3>
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => setFilters({
                          ...filters,
                          categories: e.target.checked
                            ? [...filters.categories, category]
                            : filters.categories.filter(c => c !== category)
                        })}
                        className="rounded text-purple-600"
                      />
                      {category}
                    </label>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Due Date</h3>
                  <select
                    value={filters.dueDate || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dueDate: e.target.value as 'today' | 'week' | 'all' | null
                    })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">All</option>
                    <option value="today">Due Today</option>
                    <option value="week">Due This Week</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-lg ${
                  todo.completed ? 'bg-gray-50' : 'bg-white'
                } border border-gray-200 shadow-sm`}
              >
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  
                  {editingId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <span
                          className={`${
                            todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                          }`}
                        >
                          {todo.text}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Flag className={getPriorityColor(todo.priority)} size={16} />
                            {todo.priority}
                          </span>
                          {todo.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={16} />
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Tag size={16} />
                            {todo.category}
                          </span>
                          {todo.recurring.isRecurring && (
                            <span className="flex items-center gap-1">
                              <Clock size={16} />
                              {todo.recurring.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => startEdit(todo)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredTodos.length === 0 && (
              <p className="text-center text-gray-500 py-6">
                No todos found. Add one above!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;