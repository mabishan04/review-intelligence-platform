"use client";

import ShoppingAssistantChat from "./ShoppingAssistantChat";

export default function ShoppingAssistantWrapper({ categories }: { categories: string[] }) {
  return (
    <ShoppingAssistantChat
      onPreferencesChange={() => {}}
      onGetRecommendations={async () => []}
      currentPrefs={{}}
      categories={categories}
    />
  );
}
