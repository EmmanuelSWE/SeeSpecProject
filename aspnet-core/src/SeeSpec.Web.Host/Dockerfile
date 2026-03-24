FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["src/SeeSpec.Web.Host/SeeSpec.Web.Host.csproj", "src/SeeSpec.Web.Host/"]
COPY ["src/SeeSpec.Web.Core/SeeSpec.Web.Core.csproj", "src/SeeSpec.Web.Core/"]
COPY ["src/SeeSpec.Application/SeeSpec.Application.csproj", "src/SeeSpec.Application/"]
COPY ["src/SeeSpec.Core/SeeSpec.Core.csproj", "src/SeeSpec.Core/"]
COPY ["src/SeeSpec.EntityFrameworkCore/SeeSpec.EntityFrameworkCore.csproj", "src/SeeSpec.EntityFrameworkCore/"]
WORKDIR "/src/src/SeeSpec.Web.Host"
RUN dotnet restore 

WORKDIR /src
COPY ["src/SeeSpec.Web.Host", "src/SeeSpec.Web.Host"]
COPY ["src/SeeSpec.Web.Core", "src/SeeSpec.Web.Core"]
COPY ["src/SeeSpec.Application", "src/SeeSpec.Application"]
COPY ["src/SeeSpec.Core", "src/SeeSpec.Core"]
COPY ["src/SeeSpec.EntityFrameworkCore", "src/SeeSpec.EntityFrameworkCore"]
WORKDIR "/src/src/SeeSpec.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
EXPOSE 80
WORKDIR /app
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "SeeSpec.Web.Host.dll"]
