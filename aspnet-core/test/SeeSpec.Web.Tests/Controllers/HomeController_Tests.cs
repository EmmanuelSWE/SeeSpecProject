using System.Threading.Tasks;
using SeeSpec.Models.TokenAuth;
using SeeSpec.Web.Controllers;
using Shouldly;
using Xunit;

namespace SeeSpec.Web.Tests.Controllers
{
    public class HomeController_Tests: SeeSpecWebTestBase
    {
        [Fact]
        public async Task Index_Test()
        {
            await AuthenticateAsync(null, new AuthenticateModel
            {
                UserNameOrEmailAddress = "admin",
                Password = "123qwe"
            });

            //Act
            var response = await GetResponseAsStringAsync(
                GetUrl<HomeController>(nameof(HomeController.Index))
            );

            //Assert
            response.ShouldNotBeNullOrEmpty();
        }
    }
}