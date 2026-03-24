using SeeSpec.Debugging;

namespace SeeSpec
{
    public class SeeSpecConsts
    {
        public const string LocalizationSourceName = "SeeSpec";

        public const string ConnectionStringName = "Default";

        public const bool MultiTenancyEnabled = true;


        /// <summary>
        /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
        /// </summary>
        public static readonly string DefaultPassPhrase =
            DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "3e9a491d2ef6437ca4ea056e7258bb67";
    }
}
