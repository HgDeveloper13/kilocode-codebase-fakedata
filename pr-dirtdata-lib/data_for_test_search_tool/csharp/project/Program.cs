
// Program.cs
using System;
using System.Collections.Generic;
using App.Utils;

namespace App
{
    class Program
    {
        /// <summary>
        /// Инициализирует сессию нового пользователя.
        /// </summary>
        public UserData InitializeUserSession(int userId)
        {
            Console.WriteLine("Инициализация сессии...");
            var