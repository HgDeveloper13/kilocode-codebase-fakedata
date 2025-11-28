// utils/userdata.go
package utils

import "fmt"

// UserProfile структура для данных пользователя
type UserProfile struct {
	ID    int
	Name  string
	Level int
	Gold  int
}

// LoadUserProfile загружает профиль пользователя
func LoadUserProfile(userID int) UserProfile {
	fmt.Printf("Загрузка данных для пользователя %d...\n", userID)
	return UserProfile{
		ID:    userID,
		Name:  "Test User",
		Level: 5,
		Gold:  100,
	}
}

// SaveUserProfile сохраняет данные профиля пользователя
func SaveUserProfile(userID int, data map[string]interface{}) bool {
	fmt.Printf("Сохранение данных для пользователя %d: %v\n", userID, data)
	return true
}