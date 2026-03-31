FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["SeeSpec.Web.Host/SeeSpec.Web.Host.csproj", "SeeSpec.Web.Host/"]
COPY ["SeeSpec.Web.Core/SeeSpec.Web.Core.csproj", "SeeSpec.Web.Core/"]
COPY ["SeeSpec.Application/SeeSpec.Application.csproj", "SeeSpec.Application/"]
COPY ["SeeSpec.Core/SeeSpec.Core.csproj", "SeeSpec.Core/"]
COPY ["SeeSpec.EntityFrameworkCore/SeeSpec.EntityFrameworkCore.csproj", "SeeSpec.EntityFrameworkCore/"]

WORKDIR "/src/SeeSpec.Web.Host"
RUN dotnet restore

WORKDIR /src
COPY . .

WORKDIR "/src/SeeSpec.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
EXPOSE 80
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre-headless graphviz plantuml \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "SeeSpec.Web.Host.dll"]
