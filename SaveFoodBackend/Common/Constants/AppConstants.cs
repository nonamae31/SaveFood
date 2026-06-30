namespace SaveFoodBackend.Common.Constants
{
    /// <summary>
    /// Contains application-wide constant values to avoid magic strings and numbers, enforcing SSOT/DRY principles.
    /// </summary>
    public static class AppConstants
    {
        public static class Roles
        {
            public const string Admin = "ADMIN";
            public const string Store = "STORE";
            public const string Customer = "CUSTOMER";
        }

        public static class Pagination
        {
            public const int DefaultPageSize = 10;
            public const int MaxPageSize = 50;
        }

        public static class ErrorMessages
        {
            public const string NotFound = "The requested resource was not found.";
            public const string Unauthorized = "You are not authorized to perform this action.";
            public const string ValidationError = "One or more validation errors occurred.";
        }
    }
}
