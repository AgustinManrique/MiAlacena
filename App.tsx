import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { supabase } from './utils/supabase';

export default function App() {
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('todos')
      .select()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        } else {
          setTodos(data || []);
        }
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Todo List
      </Text>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={{ fontSize: 16, marginBottom: 8 }}>{item.name}</Text>
        )}
      />
    </View>
  );
}
