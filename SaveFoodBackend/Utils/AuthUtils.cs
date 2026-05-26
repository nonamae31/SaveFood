using System;
using System.Text.RegularExpressions;

namespace SaveFoodBackend.Utils
{
    public static class AuthUtils
    {
        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) return false;
            // >= 8 ký tự, có chữ hoa, chữ thường, số, và ký tự đặc biệt
            var regex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$");
            return regex.IsMatch(password);
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrEmpty(username)) return false;
            // Độ dài 3-20 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới
            var regex = new Regex(@"^[a-zA-Z0-9_]{3,20}$");
            return regex.IsMatch(username);
        }

        public static string NormalizeEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return string.Empty;
            
            var parts = email.Split('@');
            if (parts.Length != 2) return email.ToLower();

            var local = parts[0].ToLower();
            var domain = parts[1].ToLower();

            if (domain == "gmail.com")
            {
                // Remove dots
                local = local.Replace(".", "");
                // Remove everything after '+'
                var plusIndex = local.IndexOf('+');
                if (plusIndex != -1)
                {
                    local = local.Substring(0, plusIndex);
                }
            }

            return $"{local}@{domain}";
        }
    }
}
