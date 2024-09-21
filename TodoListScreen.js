import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Dimensions, Alert, Switch } from 'react-native';
import { useQuery, useMutation, gql } from '@apollo/client';
import { getAuth } from 'firebase/auth';

const windowWidth = Dimensions.get('window').width;

const GET_TODOS = gql`
  query GetTodos($userId: String!) {
    todos(where: {user_id: {_eq: $userId}}, order_by: {created_at: desc}) {
      id
      title
      description
      is_completed
      created_at
      updated_at
    }
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($userId: String!, $title: String!, $description: String!) {
    insert_todos_one(object: {user_id: $userId, title: $title, description: $description}) {
      id
      title
      description
      is_completed
      created_at
      updated_at
    }
  }
`;

const UPDATE_TODO = gql`
  mutation UpdateTodo($id: uuid!, $title: String, $description: String, $is_completed: Boolean) {
    update_todos_by_pk(pk_columns: {id: $id}, _set: {title: $title, description: $description, is_completed: $is_completed, updated_at: "now()"}) {
      id
      title
      description
      is_completed
      updated_at
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: uuid!) {
    delete_todos_by_pk(id: $id) {
      id
    }
  }
`;

const ThemeContext = React.createContext();

const TodoListScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const { loading, error, data, refetch } = useQuery(GET_TODOS, {
    variables: { userId },
  });

  const [addTodo] = useMutation(ADD_TODO);
  const [updateTodo] = useMutation(UPDATE_TODO);
  const [deleteTodo] = useMutation(DELETE_TODO);

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your todo.');
      return;
    }
    try {
      await addTodo({
        variables: { userId, title, description },
      });
      setTitle('');
      setDescription('');
      refetch();
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Oops!', 'We couldn\'t add your todo. Please try again later.');
    }
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo) return;
    try {
      await updateTodo({
        variables: { 
          id: editingTodo.id, 
          title: editingTodo.title, 
          description: editingTodo.description,
          is_completed: editingTodo.is_completed
        },
      });
      setEditingTodo(null);
      refetch();
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Oops!', 'We couldn\'t update your todo. Please try again later.');
    }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    try {
      await updateTodo({
        variables: { 
          id, 
          is_completed: !currentStatus 
        },
      });
      refetch();
    } catch (error) {
      console.error('Error toggling todo:', error);
      Alert.alert('Oops!', 'We couldn\'t update your todo status. Please try again later.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo({
        variables: { id },
      });
      refetch();
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Oops!', 'We couldn\'t delete your todo. Please try again later.');
    }
  };

  const renderHeader = () => (
    <View style={styles(isDarkMode).header}>
      <Text style={styles(isDarkMode).headerTitle}>Todo List</Text>
      <TouchableOpacity
        style={styles(isDarkMode).referButton}
        onPress={() => navigation.navigate('Referral')}
      >
        <Text style={styles(isDarkMode).referButtonText}>Refer a Friend</Text>
      </TouchableOpacity>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => setIsDarkMode(prevMode => !prevMode)}
        value={isDarkMode}
      />
    </View>
  );

  if (loading) return <Text style={styles(isDarkMode).message}>Loading...</Text>;
  if (error) {
    console.error('Error fetching todos:', error);
    return <Text style={styles(isDarkMode).message}>We're having trouble loading your todos. Please try again later.</Text>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      <View style={styles(isDarkMode).container}>
        {renderHeader()}
        <View style={styles(isDarkMode).inputContainer}>
          <TextInput
            style={styles(isDarkMode).input}
            placeholder="Title"
            placeholderTextColor={isDarkMode ? "#888" : "#999"}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles(isDarkMode).input}
            placeholder="Description"
            placeholderTextColor={isDarkMode ? "#888" : "#999"}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity style={styles(isDarkMode).addButton} onPress={handleAddTodo}>
            <Text style={styles(isDarkMode).addButtonText}>Add Todo</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data.todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles(isDarkMode).todoItem}>
              {editingTodo && editingTodo.id === item.id ? (
                <View>
                  <TextInput
                    style={styles(isDarkMode).editInput}
                    value={editingTodo.title}
                    onChangeText={(text) => setEditingTodo({...editingTodo, title: text})}
                  />
                  <TextInput
                    style={styles(isDarkMode).editInput}
                    value={editingTodo.description}
                    onChangeText={(text) => setEditingTodo({...editingTodo, description: text})}
                  />
                  <TouchableOpacity style={styles(isDarkMode).saveButton} onPress={handleUpdateTodo}>
                    <Text style={styles(isDarkMode).saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles(isDarkMode).todoTextContainer}>
                  <Text style={[styles(isDarkMode).todoTitle, item.is_completed && styles(isDarkMode).completedTodo]}>
                    {item.title}
                  </Text>
                  <Text style={styles(isDarkMode).todoDescription}>{item.description}</Text>
                  <Text style={styles(isDarkMode).todoTimestamp}>Created: {formatDate(item.created_at)}</Text>
                  <Text style={styles(isDarkMode).todoTimestamp}>Updated: {formatDate(item.updated_at)}</Text>
                </View>
              )}
              <View style={styles(isDarkMode).todoButtonsContainer}>
                <TouchableOpacity
                  style={[styles(isDarkMode).todoButton, styles(isDarkMode).toggleButton]}
                  onPress={() => handleToggleTodo(item.id, item.is_completed)}
                >
                  <Text style={styles(isDarkMode).todoButtonText}>
                    {item.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles(isDarkMode).todoButton, styles(isDarkMode).editButton]}
                  onPress={() => setEditingTodo(item)}
                >
                  <Text style={styles(isDarkMode).todoButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles(isDarkMode).todoButton, styles(isDarkMode).deleteButton]}
                  onPress={() => handleDeleteTodo(item.id)}
                >
                  <Text style={styles(isDarkMode).todoButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </ThemeContext.Provider>
  );
};

const styles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#333',
  },
  referButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  referButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: isDarkMode ? '#444' : '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 8,
    color: isDarkMode ? '#fff' : '#333',
    fontSize: 16,
  },
  editInput: {
    height: 40,
    borderColor: isDarkMode ? '#555' : '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: isDarkMode ? '#444' : '#f9f9f9',
    borderRadius: 5,
    color: isDarkMode ? '#fff' : '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  todoItem: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: isDarkMode ? '#000' : '#888',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  todoTextContainer: {
    marginBottom: 15,
  },
  todoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: isDarkMode ? '#fff' : '#333',
  },
  todoDescription: {
    fontSize: 16,
    color: isDarkMode ? '#bbb' : '#666',
    marginBottom: 8,
  },
  todoTimestamp: {
    fontSize: 12,
    color: isDarkMode ? '#888' : '#999',
    marginBottom: 4,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: isDarkMode ? '#888' : '#aaa',
  },
  todoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todoButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  toggleButton: {
    backgroundColor: '#2196F3',
  },
  editButton: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  todoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: isDarkMode ? '#fff' : '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TodoListScreen;