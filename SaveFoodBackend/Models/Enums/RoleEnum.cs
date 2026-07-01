namespace SaveFoodBackend.Models.Enums
{
    /// <summary>
    /// Represents the user roles within the system for authentication and authorization.
    /// </summary>
    public enum RoleEnum : byte
    {
        /// <summary>
        /// Regular customer user.
        /// </summary>
        Customer = 1,

        /// <summary>
        /// Store owner or manager.
        /// </summary>
        Store = 2,

        /// <summary>
        /// System administrator.
        /// </summary>
        Admin = 3
    }
}
