import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: `Hi ${user?.name || "there"}, I'm your AI HR Assistant! You can ask me about your leaves, company policies, or attendance.`, sender: "ai" }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!query.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: query, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    // Mock AI Response
    setTimeout(() => {
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: "I found 12 days of leave remaining in your balance. Would you like me to open the leave application form for you?", 
        sender: "ai" 
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 200);
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-4 border-b border-gray-800 flex-row items-center justify-between shadow-sm bg-gray-900 z-10">
        <View>
          <Text className="text-2xl font-bold text-white">AI Assistant</Text>
          <Text className="text-gray-400 text-xs mt-1">Powered by Gemini</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-800 p-2 rounded-full">
          <Text className="text-gray-300 font-bold px-2">Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map(msg => (
          <View 
            key={msg.id} 
            className={`mb-4 max-w-[80%] rounded-2xl p-4 ${msg.sender === "user" ? "bg-blue-600 self-end rounded-br-none" : "bg-gray-800 self-start rounded-bl-none border border-gray-700/50"}`}
          >
            <Text className="text-white text-base leading-relaxed">{msg.text}</Text>
          </View>
        ))}
        {loading && (
          <View className="bg-gray-800 self-start rounded-2xl rounded-bl-none p-4 border border-gray-700/50 flex-row items-center space-x-2 mb-4">
            <ActivityIndicator color="#3b82f6" size="small" />
            <Text className="text-gray-400 ml-2">Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View className="p-4 bg-gray-900 border-t border-gray-800 flex-row items-center">
        <TextInput 
          className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-5 py-3 text-white mr-3"
          placeholder="Ask me anything..."
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          className="bg-blue-600 h-12 w-12 rounded-full items-center justify-center shadow-lg"
          onPress={handleSend}
          disabled={!query.trim() || loading}
        >
          <Text className="text-white font-bold text-lg">↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
