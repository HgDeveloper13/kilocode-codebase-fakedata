// main.go
package main

import (
	"fmt"
	"reference-lib/data_for_test_search_tool/go/utils"
)

// initializeUserSession инициализирует сессию пользователя
func initializeUserSession(userID int) utils.UserProfile {
	fmt.Println("Инициализация сессии...")
	userData := utils.LoadUserProfile(userID)
	fmt.Printf("Пользователь %s вошел в систему.\n", userData.Name)
	return userData
}

// handleUserAction обрабатывает действия пользователя
func handleUserAction(userID int, action string) {
	if action == "save" {
		currentData := map[string]interface{}{"Gold": 160}
		utils.SaveUserProfile(userID, currentData)
		fmt.Printf("Действие '%s' для пользователя %d обработано.\n", action, userID)
	} else {
		fmt.Printf("Неизвестное действие: %s\n", action)
	}
}

func main() {
	testUserID := 303
	initializeUserSession(testUserID)
	handleUserAction(testUserID, "save")
}