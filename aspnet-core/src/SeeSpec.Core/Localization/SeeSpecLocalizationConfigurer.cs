using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace SeeSpec.Localization
{
    public static class SeeSpecLocalizationConfigurer
    {
        public static void Configure(ILocalizationConfiguration localizationConfiguration)
        {
            localizationConfiguration.Sources.Add(
                new DictionaryBasedLocalizationSource(SeeSpecConsts.LocalizationSourceName,
                    new XmlEmbeddedFileLocalizationDictionaryProvider(
                        typeof(SeeSpecLocalizationConfigurer).GetAssembly(),
                        "SeeSpec.Localization.SourceFiles"
                    )
                )
            );
        }
    }
}
